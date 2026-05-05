import { useEffect, useState } from "react";
import { Copy, Hash, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  deleteInstagramResponseProfileRule,
  getInstagramResponseProfile,
  putInstagramResponseProfileRule,
} from "@/lib/api";
import { useDashboard } from "@/lib/dashboard-context";
import type { InstagramResponseRule } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { TenantPickerPage } from "@/pages/tenant-picker-page";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DraftRule = {
  localId: string;
  id?: string;
  hashtag: string;
  persistedHashtag?: string;
  persistedComments?: string[];
  persistedDms?: string[];
  comments: string[];
  dms: string[];
  priority: number;
};

function newLocalId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeHashtag(value: string) {
  return value.trim().replace(/^#/, "").toLowerCase();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function createDraftRule(priority: number, hashtag = ""): DraftRule {
  return {
    localId: newLocalId(),
    hashtag,
    comments: [""],
    dms: [""],
    priority,
  };
}

function toDraftRules(rules: InstagramResponseRule[]) {
  return rules
    .flatMap((rule, ruleIndex) => {
      const hashtags = rule.hashtags.length ? rule.hashtags : [""];
      return hashtags.map((hashtag, hashtagIndex) => ({
        localId: `${rule.id || "rule"}-${ruleIndex}-${hashtagIndex}-${hashtag}`,
        id: `${rule.id || `rule-${ruleIndex + 1}`}:${hashtag || hashtagIndex}`,
        hashtag,
        persistedHashtag: hashtag,
        persistedComments: compactStrings(rule.comment),
        persistedDms: compactStrings(rule.dm),
        comments: editableValues([...rule.comment]),
        dms: editableValues([...rule.dm]),
        priority: rule.priority ?? ruleIndex,
      }));
    })
    .sort((a, b) => b.priority - a.priority);
}

function compactStrings(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function editableValues(values: string[]) {
  return values.length ? values : [""];
}

function generateCopiedHashtag(baseHashtag: string, rules: DraftRule[]) {
  const normalizedBase = normalizeHashtag(baseHashtag) || "hashtag";
  const existing = new Set(rules.map((rule) => normalizeHashtag(rule.hashtag)).filter(Boolean));
  let candidate = `${normalizedBase}-copy`;
  let suffix = 2;

  while (existing.has(candidate)) {
    candidate = `${normalizedBase}-copy-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function isRuleDirty(rule: DraftRule) {
  const hashtag = normalizeHashtag(rule.hashtag);
  const comments = compactStrings(rule.comments);
  const dms = compactStrings(rule.dms);

  if (!rule.persistedHashtag && !rule.persistedComments && !rule.persistedDms) {
    return Boolean(hashtag || comments.length || dms.length);
  }

  return (
    hashtag !== normalizeHashtag(rule.persistedHashtag || "") ||
    !arraysEqual(comments, rule.persistedComments || []) ||
    !arraysEqual(dms, rule.persistedDms || [])
  );
}

function toApiRule(rule: DraftRule, index: number) {
  return {
    id: rule.id || `dashboard-rule-${index + 1}`,
    hashtags: [normalizeHashtag(rule.hashtag)].filter(Boolean),
    comment: compactStrings(rule.comments),
    dm: compactStrings(rule.dms),
    active: true,
    priority: rule.priority,
  };
}

function ruleMatchesSearch(rule: DraftRule, query: string) {
  if (!query) return true;

  const searchText = [
    rule.hashtag,
    `#${rule.hashtag}`,
    ...rule.comments,
    ...rule.dms,
  ]
    .map(normalizeSearchText)
    .join("\n");

  return searchText.includes(query);
}

function VariantEditor({
  label,
  values,
  disabled,
  placeholder,
  textareaClassName,
  onChange,
}: {
  label: string;
  values: string[];
  disabled: boolean;
  placeholder: string;
  textareaClassName?: string;
  onChange: (values: string[]) => void;
}) {
  function updateValue(index: number, value: string) {
    onChange(values.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  }

  function removeValue(index: number) {
    const nextValues = values.filter((_, entryIndex) => entryIndex !== index);
    onChange(nextValues.length ? nextValues : [""]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 gap-2"
          disabled={disabled}
          onClick={() => onChange([...values, ""])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              className={cn("min-h-20 flex-1 bg-white", textareaClassName)}
              onChange={(event) => updateValue(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 shrink-0 p-0"
              disabled={disabled}
              onClick={() => removeValue(index)}
              title={`Remove ${label.toLowerCase()} response`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IgHashtagsPage() {
  const {
    selectedTenant,
    selectedTenantId,
    canWriteSelectedTenant,
    setError,
    setSuccess,
  } = useDashboard();
  const [profileName, setProfileName] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [source, setSource] = useState("");
  const [rules, setRules] = useState<DraftRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingRuleIds, setSavingRuleIds] = useState<Set<string>>(() => new Set());
  const [deletingRuleIds, setDeletingRuleIds] = useState<Set<string>>(() => new Set());
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const filteredRules = normalizedSearchQuery
    ? rules.filter((rule) => ruleMatchesSearch(rule, normalizedSearchQuery))
    : rules;

  useEffect(() => {
    if (!selectedTenantId) return;

    const tenantId = selectedTenantId;
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      const { response, payload } = await getInstagramResponseProfile(tenantId);
      if (cancelled) return;
      if (!response.ok) {
        setError((payload as any)?.error || "Unable to load Instagram hashtag responses");
        setLoading(false);
        return;
      }

      setProfileName(payload?.profileName || payload?.profile?.profile || "");
      setUpdatedAt(payload?.profile?.updatedAt || "");
      setSource(payload?.profile?.source || "");
      setRules(toDraftRules(payload?.profile?.rules || []));
      setLoading(false);
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [selectedTenantId, setError]);

  function updateRule(localId: string, patch: Partial<DraftRule>) {
    setRules((currentRules) =>
      currentRules.map((rule) => (rule.localId === localId ? { ...rule, ...patch } : rule))
    );
  }

  function clearSearch() {
    if (!searchQuery) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchParams(nextParams, { replace: true });
  }

  function scrollRuleIntoView(localId: string) {
    window.requestAnimationFrame(() => {
      const ruleElement = document.getElementById(`hashtag-rule-${localId}`);
      if (ruleElement) {
        ruleElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function addRule() {
    clearSearch();
    setRules((currentRules) => {
      const nextPriority = Math.max(-1, ...currentRules.map((rule) => rule.priority)) + 1;
      return [createDraftRule(nextPriority), ...currentRules];
    });
  }

  function copyRule(rule: DraftRule) {
    const copiedLocalId = newLocalId();
    setHighlightedRuleId(copiedLocalId);
    setRules((currentRules) => {
      const nextPriority = Math.max(-1, ...currentRules.map((entry) => entry.priority)) + 1;
      return [
        {
          localId: copiedLocalId,
          hashtag: generateCopiedHashtag(rule.hashtag, currentRules),
          comments: editableValues(compactStrings(rule.comments)),
          dms: editableValues(compactStrings(rule.dms)),
          priority: nextPriority,
        },
        ...currentRules,
      ];
    });
    scrollRuleIntoView(copiedLocalId);
  }

  async function saveRule(rule: DraftRule, index: number) {
    if (!selectedTenantId) return;
    const apiRule = toApiRule(rule, index);
    const nextHashtag = apiRule.hashtags[0];

    if (!nextHashtag) {
      setError("Add a hashtag before saving this response.");
      return;
    }
    if (!apiRule.comment.length && !apiRule.dm.length) {
      setError("Add at least one comment or DM response before saving this hashtag.");
      return;
    }

    setSavingRuleIds((current) => new Set(current).add(rule.localId));
    setSuccess(null);
    setError(null);
    const { response, payload } = await putInstagramResponseProfileRule(selectedTenantId, {
      profileName,
      previousHashtag: rule.persistedHashtag,
      rule: apiRule,
    });

    if (!response.ok) {
      setError((payload as any)?.error || "Unable to save this Instagram hashtag response");
      setSavingRuleIds((current) => {
        const next = new Set(current);
        next.delete(rule.localId);
        return next;
      });
      return;
    }

    setProfileName(payload?.profileName || payload?.profile?.profile || profileName);
    setUpdatedAt(payload?.profile?.updatedAt || "");
    setSource(payload?.profile?.source || "");
    const savedRule = payload?.profile?.rules?.find((entry) => entry.hashtags.includes(nextHashtag));
    setRules((currentRules) =>
      currentRules.map((currentRule) =>
        currentRule.localId === rule.localId
          ? {
              ...currentRule,
              id: savedRule?.id || currentRule.id || apiRule.id,
              hashtag: nextHashtag,
              persistedHashtag: nextHashtag,
              comments: editableValues(savedRule?.comment?.length ? savedRule.comment : apiRule.comment),
              dms: editableValues(savedRule?.dm?.length ? savedRule.dm : apiRule.dm),
              persistedComments: compactStrings(savedRule?.comment?.length ? savedRule.comment : apiRule.comment),
              persistedDms: compactStrings(savedRule?.dm?.length ? savedRule.dm : apiRule.dm),
              priority: savedRule?.priority ?? currentRule.priority,
            }
          : currentRule
      )
    );
    setSuccess(`Saved #${nextHashtag}`);
    if (highlightedRuleId === rule.localId) {
      setHighlightedRuleId(null);
    }
    setSavingRuleIds((current) => {
      const next = new Set(current);
      next.delete(rule.localId);
      return next;
    });
  }

  async function deleteRule(rule: DraftRule) {
    const hashtagToDelete = normalizeHashtag(rule.persistedHashtag || rule.hashtag);
    const label = hashtagToDelete ? `#${hashtagToDelete}` : "this unsaved hashtag";
    const discardMessage = isRuleDirty(rule) ? " Unsaved edits on this hashtag will be discarded." : "";
    const confirmed = window.confirm(
      `Delete ${label}? This will remove its comment and DM responses.${discardMessage}`
    );

    if (!confirmed) return;

    if (!rule.persistedHashtag) {
      setRules((currentRules) => currentRules.filter((currentRule) => currentRule.localId !== rule.localId));
      if (highlightedRuleId === rule.localId) {
        setHighlightedRuleId(null);
      }
      return;
    }

    if (!selectedTenantId || !hashtagToDelete) return;

    setDeletingRuleIds((current) => new Set(current).add(rule.localId));
    setSuccess(null);
    setError(null);
    const { response, payload } = await deleteInstagramResponseProfileRule(selectedTenantId, {
      profileName,
      hashtag: hashtagToDelete,
    });

    if (!response.ok) {
      setError((payload as any)?.error || "Unable to delete this Instagram hashtag response");
      setDeletingRuleIds((current) => {
        const next = new Set(current);
        next.delete(rule.localId);
        return next;
      });
      return;
    }

    setProfileName(payload?.profileName || payload?.profile?.profile || profileName);
    setUpdatedAt(payload?.profile?.updatedAt || "");
    setSource(payload?.profile?.source || "");
    setRules((currentRules) => currentRules.filter((currentRule) => currentRule.localId !== rule.localId));
    if (highlightedRuleId === rule.localId) {
      setHighlightedRuleId(null);
    }
    setSuccess(`Deleted #${hashtagToDelete}`);
    setDeletingRuleIds((current) => {
      const next = new Set(current);
      next.delete(rule.localId);
      return next;
    });
  }

  if (!selectedTenant) {
    return <TenantPickerPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={selectedTenant.name}
        title="IG -> Hashtags"
        description="Configure the comment and DM variants that Instagram automation can randomly select for each hashtag."
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-100 text-slate-700">{profileName || "profile pending"}</Badge>
          </div>
        }
      />

      <Card className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
        <div>
          <div className="text-sm font-semibold text-foreground">Response profile</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This profile is also written to the tenant Meta config as <span className="font-mono">INSTAGRAM_RESPONSE_PROFILE</span>.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Profile name
            <Input
              value={profileName}
              disabled={!canWriteSelectedTenant}
              placeholder="inglesconliza"
              onChange={(event) => setProfileName(event.target.value)}
            />
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
            Updated {formatDateTime(updatedAt)}
            {source ? <span> · {source}</span> : null}
          </div>
        </div>
      </Card>

      {!canWriteSelectedTenant ? (
        <Card className="border-amber-200 bg-amber-50 text-sm leading-6 text-amber-800">
          Your tenant role is read-only. You can inspect hashtag responses, but saving changes requires owner, admin, or editor access.
        </Card>
      ) : null}

      {loading ? (
        <Card className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Instagram hashtag responses...
        </Card>
      ) : null}

      {!loading && !rules.length ? (
        <Card className="space-y-4 border-dashed">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              No hashtag rules yet
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Add the first hashtag, then define one or more public comment responses and one or more private DM responses.
          </p>
          <Button className="gap-2" disabled={!canWriteSelectedTenant} onClick={addRule}>
            <Plus className="h-4 w-4" />
            Add hashtag
          </Button>
        </Card>
      ) : null}

      {rules.length ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Hashtag responses</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? `Showing ${filteredRules.length} of ${rules.length} matching "${searchQuery}".`
                : "Newest hashtags are shown first."}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {searchQuery ? (
              <Button type="button" variant="ghost" disabled={!searchQuery} onClick={clearSearch}>
                Clear search
              </Button>
            ) : null}
            <Button variant="secondary" className="gap-2" disabled={!canWriteSelectedTenant} onClick={addRule}>
              <Plus className="h-4 w-4" />
              Add hashtag
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredRules.map((rule, index) => {
          const dirty = isRuleDirty(rule);
          const saving = savingRuleIds.has(rule.localId);
          const deleting = deletingRuleIds.has(rule.localId);
          const unsavedDraft = !rule.persistedHashtag && dirty;
          const highlighted = highlightedRuleId === rule.localId && dirty;

          return (
            <Card
              id={`hashtag-rule-${rule.localId}`}
              key={rule.localId}
              className={cn(
                "scroll-mt-24 space-y-5 transition-all duration-300",
                unsavedDraft && "border-brand/40 bg-indigo-50/30 shadow-[0_24px_70px_rgba(79,70,229,0.18)]",
                highlighted && "ring-2 ring-brand/25"
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid flex-1 gap-3 sm:max-w-xs">
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Hashtag
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={rule.hashtag}
                        disabled={!canWriteSelectedTenant}
                        placeholder="grupo"
                        className="bg-white pl-8"
                        onChange={(event) => updateRule(rule.localId, { hashtag: event.target.value })}
                      />
                    </div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    disabled={!canWriteSelectedTenant || deleting}
                    onClick={() => copyRule(rule)}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant={dirty ? "default" : "secondary"}
                    className="gap-2"
                    disabled={!canWriteSelectedTenant || loading || saving || deleting || !dirty}
                    onClick={() => void saveRule(rule, index)}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-rose-600 hover:text-rose-700"
                    disabled={!canWriteSelectedTenant || saving || deleting}
                    onClick={() => void deleteRule(rule)}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <VariantEditor
                    label="Comment responses"
                    values={rule.comments}
                    disabled={!canWriteSelectedTenant}
                    placeholder="Te envié el enlace por mensaje directo."
                    onChange={(comments) => updateRule(rule.localId, { comments })}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <VariantEditor
                    label="DM responses"
                    values={rule.dms}
                    disabled={!canWriteSelectedTenant}
                    placeholder="Aquí tienes el enlace a la comunidad..."
                    textareaClassName="min-h-32"
                    onChange={(dms) => updateRule(rule.localId, { dms })}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && rules.length > 0 && filteredRules.length === 0 ? (
        <Card className="border-dashed text-sm leading-6 text-muted-foreground">
          No hashtag responses match "{searchQuery}". Clear the search or try a hashtag, comment, or DM phrase.
        </Card>
      ) : null}

      {rules.length ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" className="gap-2" disabled={!canWriteSelectedTenant} onClick={addRule}>
            <Plus className="h-4 w-4" />
            Add hashtag
          </Button>
          <div className="text-sm text-muted-foreground">
            Save each hashtag independently to keep requests small and avoid overwriting unrelated edits.
          </div>
        </div>
      ) : null}
    </div>
  );
}
