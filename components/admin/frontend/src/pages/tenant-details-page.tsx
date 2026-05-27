import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, ExternalLink, KeyRound, Loader2, MousePointer2, Save, Settings2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  addTenantMetaAccount,
  getDiscoveredMetaAccounts,
  getMetaAccountTokenStatus,
  getTenant,
  putTenantConfig,
  rotateMetaAccountToken,
} from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import type { DiscoveredMetaAccount, MetaAccountTokenStatus, Tenant, TenantMetaAccount } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DetailTab = "accounts" | "config";

export function TenantDetailsPage() {
  const { tenantId } = useParams();
  const { session, refreshWorkspace, setError, setSuccess } = useAdmin();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredMetaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("accounts");
  const [accountProvider, setAccountProvider] = useState("instagram");
  const [accountId, setAccountId] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [configComponent, setConfigComponent] = useState("meta");
  const [configKey, setConfigKey] = useState("INSTAGRAM_RESPONSE_PROFILE");
  const [configValue, setConfigValue] = useState("\"inglesconliza\"");
  const [configSecret, setConfigSecret] = useState(false);
  const [tokenStatuses, setTokenStatuses] = useState<Record<string, MetaAccountTokenStatus>>({});
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});
  const [tokenKeys, setTokenKeys] = useState<Record<string, string>>({});
  const [loadingTokenStatus, setLoadingTokenStatus] = useState(false);
  const [rotatingAccountId, setRotatingAccountId] = useState<string | null>(null);

  const canWriteTenant = useMemo(() => {
    if (session?.isSuperAdmin) return true;
    const membership = tenant?.members.find((entry) => entry.email === session?.email && entry.status === "active");
    if (!membership) return false;
    return ["owner", "admin", "editor"].includes(membership.role.toLowerCase());
  }, [session, tenant]);

  const canRotateTokens = useMemo(() => {
    if (session?.isSuperAdmin) return true;
    const membership = tenant?.members.find((entry) => entry.email === session?.email && entry.status === "active");
    if (membership && ["owner", "admin"].includes(membership.role.toLowerCase())) return true;
    const access = session?.tenantAccess?.find((entry) => entry.tenantId === tenant?.id && entry.status === "active");
    return Boolean(access && ["owner", "admin"].includes(access.role.toLowerCase()));
  }, [session, tenant]);

  async function loadTokenStatuses(nextTenant: Tenant) {
    if (!tenantId || !nextTenant.metaAccounts.length) {
      setTokenStatuses({});
      return;
    }

    setLoadingTokenStatus(true);
    try {
      const entries = await Promise.all(
        nextTenant.metaAccounts.map(async (account) => {
          const { response, payload } = await getMetaAccountTokenStatus(tenantId, account.accountId);
          return [account.accountId, response.ok ? payload : null] as const;
        })
      );

      const nextStatuses: Record<string, MetaAccountTokenStatus> = {};
      const nextKeys: Record<string, string> = {};
      for (const [accountId, status] of entries) {
        if (status) {
          nextStatuses[accountId] = status;
          nextKeys[accountId] = status.tokenKey;
        }
      }
      setTokenStatuses(nextStatuses);
      setTokenKeys((current) => ({ ...nextKeys, ...current }));
    } finally {
      setLoadingTokenStatus(false);
    }
  }

  async function loadTenant() {
    if (!tenantId) return;
    setLoading(true);
    const { response, payload } = await getTenant(tenantId);
    if (!response.ok) {
      setTenant(null);
      setError((payload as any)?.error || "Unable to load tenant");
      setLoading(false);
      return;
    }
    const nextTenant = payload?.tenant || null;
    setTenant(nextTenant);
    setLoading(false);
    if (nextTenant) {
      await loadTokenStatuses(nextTenant);
    }
  }

  async function loadDiscoveredAccounts() {
    const { response, payload } = await getDiscoveredMetaAccounts({ limit: 500 });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to load discovered Meta accounts");
      return;
    }
    setDiscoveredAccounts(payload?.accounts || []);
  }

  useEffect(() => {
    void Promise.all([loadTenant(), loadDiscoveredAccounts()]);
  }, [tenantId]);

  function parseConfigInput(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async function onAddAccount() {
    if (!tenantId) return;
    setSuccess(null);
    setError(null);
    const { response, payload } = await addTenantMetaAccount(tenantId, {
      provider: accountProvider,
      accountId,
      username: accountUsername || undefined,
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to register account");
      return;
    }
    setAccountId("");
    setAccountUsername("");
    setSuccess(`Registered ${(payload as any)?.account?.accountId || "account"}`);
    await Promise.all([loadTenant(), loadDiscoveredAccounts(), refreshWorkspace()]);
  }

  function useDiscoveredAccount(account: DiscoveredMetaAccount) {
    setAccountProvider(account.provider || "instagram");
    setAccountId(account.accountId);
    setAccountUsername(account.username || "");
  }

  async function onSaveConfig() {
    if (!tenantId) return;
    setSuccess(null);
    setError(null);
    const { response, payload } = await putTenantConfig(tenantId, {
      component: configComponent,
      key: configKey,
      value: parseConfigInput(configValue),
      isSecret: configSecret,
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to save config");
      return;
    }
    setSuccess(`Saved ${configComponent}:${configKey}`);
    await Promise.all([loadTenant(), refreshWorkspace()]);
  }

  async function onRotateToken(account: TenantMetaAccount) {
    if (!tenantId) return;
    const token = tokenInputs[account.accountId]?.trim() || "";
    if (!token) {
      setError("Paste a Meta access token before rotating it.");
      return;
    }

    setSuccess(null);
    setError(null);
    setRotatingAccountId(account.accountId);
    const { response, payload } = await rotateMetaAccountToken(tenantId, account.accountId, {
      token,
      tokenKey: tokenKeys[account.accountId],
    });
    setRotatingAccountId(null);

    if (!response.ok) {
      const detail = (payload as any)?.detail ? `: ${(payload as any).detail}` : "";
      setError(`${(payload as any)?.error || "Unable to rotate token"}${detail}`);
      return;
    }

    setTokenInputs((current) => ({ ...current, [account.accountId]: "" }));
    setTokenStatuses((current) => ({ ...current, [account.accountId]: payload }));
    setTokenKeys((current) => ({ ...current, [account.accountId]: payload.tokenKey }));
    setSuccess(`Rotated token for ${account.username || account.accountId}`);
    await Promise.all([loadTenant(), refreshWorkspace()]);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to tenants
        </Link>
      </div>

      <PageHeader
        eyebrow="Brain Tenant"
        title={tenant?.name || (loading ? "Loading tenant..." : "Tenant not found")}
        description={tenant?.description || "Manage Brain-specific Meta account mappings and runtime configuration for this Account-owned tenant."}
        actions={
          tenant ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{tenant.status}</Badge>
              <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">{tenant.slug}</Badge>
              <a href={`https://account.omattic.com/admin/tenants?tenant=${encodeURIComponent(tenant.id)}`}>
                <Button variant="secondary" className="gap-2">
                  Manage members in Account
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          ) : null
        }
      />

      {tenant ? (
        <>
          <Card className="border-blue-100 bg-blue-50/80 text-sm leading-6 text-blue-900 shadow-none">
            Account owns tenant identity and membership. Brain Admin can read those members for authorization, but edits only Brain-specific mappings and runtime config.
          </Card>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "accounts" as const, label: "Meta Accounts", icon: CreditCard },
              { id: "config" as const, label: "Runtime Config", icon: Settings2 },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeTab === item.id
                    ? "border-[#635bff]/20 bg-[#f5f7ff] text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === "accounts" ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Register account</div>
                </div>
                {canWriteTenant ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                      Pick a discovered account below to fill these fields from webhook history.
                    </div>
                    <Input placeholder="instagram" value={accountProvider} onChange={(event) => setAccountProvider(event.target.value)} />
                    <Input placeholder="17841401707784079" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
                    <Input placeholder="username, optional" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} />
                    <Button className="w-full gap-2" onClick={() => void onAddAccount()}>
                      <CreditCard className="h-4 w-4" />
                      Register account
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                    Your current tenant role is read-only for Meta account changes.
                  </div>
                )}
              </Card>

              <div className="space-y-6">
                <Card className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="h-4 w-4 text-[#635bff]" />
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Discovered accounts</div>
                  </div>
                  <div className="space-y-3">
                    {discoveredAccounts.length ? discoveredAccounts.map((account) => (
                      <button
                        key={`${account.provider}:${account.accountId}`}
                        type="button"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-brand/40 hover:bg-white"
                        onClick={() => useDiscoveredAccount(account)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-950">
                              {account.username || account.accountId}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{account.provider} · {account.accountId}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Last event {formatDateTime(account.lastSeenAt)} · {account.eventCount} event{account.eventCount === 1 ? "" : "s"}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <Badge className={account.tenantId ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {account.tenantName || "unmapped"}
                            </Badge>
                            <span className="text-xs font-medium text-brand">Use</span>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                        No Meta accounts have been discovered from webhook history yet.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#635bff]" />
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Mapped accounts</div>
                  </div>
                  <div className="space-y-3">
                    {tenant.metaAccounts.length ? tenant.metaAccounts.map((account) => (
                      <div key={account.id} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-medium text-slate-950">{account.username || account.accountId}</div>
                            <div className="mt-1 text-xs text-slate-500">{account.provider} · {account.accountId}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{account.status}</Badge>
                            {account.label ? <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">{account.label}</Badge> : null}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-4 w-4 text-[#635bff]" />
                              <div>
                                <div className="text-sm font-semibold text-slate-950">Meta access token</div>
                                <div className="text-xs text-slate-500">
                                  {loadingTokenStatus && !tokenStatuses[account.accountId]
                                    ? "Checking token status..."
                                    : tokenStatuses[account.accountId]?.configured
                                      ? `Configured at ${tokenStatuses[account.accountId]?.tokenKey}`
                                      : "No token found in META_TOKENS for this account."}
                                </div>
                              </div>
                            </div>
                            <Badge className={tokenStatuses[account.accountId]?.configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {tokenStatuses[account.accountId]?.configured ? "Configured" : "Missing"}
                            </Badge>
                          </div>
                          {canRotateTokens ? (
                            <div className="space-y-3">
                              <Input
                                value={tokenKeys[account.accountId] || ""}
                                placeholder="instagram/access-token/inglesconliza"
                                onChange={(event) =>
                                  setTokenKeys((current) => ({ ...current, [account.accountId]: event.target.value }))
                                }
                              />
                              <Input
                                type="password"
                                autoComplete="off"
                                value={tokenInputs[account.accountId] || ""}
                                placeholder="Paste new Meta access token"
                                onChange={(event) =>
                                  setTokenInputs((current) => ({ ...current, [account.accountId]: event.target.value }))
                                }
                              />
                              <Button
                                className="w-full gap-2"
                                disabled={rotatingAccountId === account.accountId}
                                onClick={() => void onRotateToken(account)}
                              >
                                {rotatingAccountId === account.accountId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <KeyRound className="h-4 w-4" />
                                )}
                                Validate and rotate token
                              </Button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">
                              Token rotation requires tenant owner/admin access.
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                        No Meta accounts are mapped to this tenant yet.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {activeTab === "config" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Write config</div>
                </div>
                {canWriteTenant ? (
                  <div className="space-y-3">
                    <Input value={configComponent} onChange={(event) => setConfigComponent(event.target.value)} />
                    <Input value={configKey} onChange={(event) => setConfigKey(event.target.value)} />
                    <Textarea value={configValue} onChange={(event) => setConfigValue(event.target.value)} />
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <input type="checkbox" checked={configSecret} onChange={(event) => setConfigSecret(event.target.checked)} />
                      Treat this value as secret metadata in the admin layer
                    </label>
                    <Button className="w-full gap-2" onClick={() => void onSaveConfig()}>
                      <Save className="h-4 w-4" />
                      Save config
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                    Your current tenant role is read-only for runtime configuration changes.
                  </div>
                )}
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Current config</div>
                </div>
                <div className="space-y-3">
                  {tenant.configs.length ? tenant.configs.map((config) => (
                    <div key={config.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-950">{config.component}:{config.key}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {config.isSecret ? "Secret-aware" : "Visible"} · Updated {formatDateTime(config.updatedAt)}
                          </div>
                        </div>
                        <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">
                          {config.isJson ? "json" : "string"}
                        </Badge>
                      </div>
                      <pre className="mt-3 overflow-auto rounded-xl bg-white px-3 py-3 text-xs leading-6 text-slate-700">
                        {typeof config.parsedValue === "string"
                          ? config.parsedValue
                          : JSON.stringify(config.parsedValue, null, 2)}
                      </pre>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                      No tenant runtime config has been written yet.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </>
      ) : (
        <Card className="text-sm text-slate-500">
          {loading ? "Loading tenant details..." : "Tenant not found or no longer visible in your scope."}
        </Card>
      )}
    </div>
  );
}
