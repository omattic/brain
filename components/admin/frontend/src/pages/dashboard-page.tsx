import { useEffect, useMemo, useState } from "react";
import { LogOut, RefreshCcw, RotateCcw, ShieldCheck, UserPlus, Webhook } from "lucide-react";
import { addTenantMember, addTenantMetaAccount, createTenant, getFailedEvents, getLoginUrl, getLogoutUrl, getMetaWebhookEvent, getSession, getTenants, putTenantConfig, recoverMetaWebhookEvents } from "@/lib/api";
import type { AdminSession, MetaWebhookEvent, Tenant } from "@/lib/types";
import { formatDateTime, formatJson } from "@/lib/utils";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function parseConfigInput(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function DashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [events, setEvents] = useState<MetaWebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MetaWebhookEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantDescription, setTenantDescription] = useState("");

  const [memberTenantId, setMemberTenantId] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("admin");

  const [accountTenantId, setAccountTenantId] = useState("");
  const [accountProvider, setAccountProvider] = useState("instagram");
  const [accountId, setAccountId] = useState("");
  const [accountUsername, setAccountUsername] = useState("");

  const [configTenantId, setConfigTenantId] = useState("");
  const [configComponent, setConfigComponent] = useState("meta");
  const [configKey, setConfigKey] = useState("INSTAGRAM_RESPONSE_PROFILE");
  const [configValue, setConfigValue] = useState("\"inglesconliza\"");
  const [configSecret, setConfigSecret] = useState(false);

  const [filterTenantId, setFilterTenantId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterLimit, setFilterLimit] = useState("25");

  const redirectUri = useMemo(() => window.location.href, []);

  async function requireSession() {
    const { response, payload } = await getSession();
    if (response.ok && payload?.authenticated && payload.user) {
      setSession(payload.user);
      return payload.user;
    }

    window.location.replace(getLoginUrl(redirectUri));
    return null;
  }

  async function loadTenantsAndEvents() {
    const [{ payload: tenantsPayload }, { payload: eventsPayload }] = await Promise.all([
      getTenants(),
      getFailedEvents({
        tenantId: filterTenantId || undefined,
        sourceAccountId: filterAccountId || undefined,
        limit: Number(filterLimit || "25"),
      }),
    ]);

    const tenantRows = tenantsPayload?.tenants || [];
    setTenants(tenantRows);
    setEvents(eventsPayload?.events || []);

    if (!memberTenantId && tenantRows[0]?.id) setMemberTenantId(tenantRows[0].id);
    if (!accountTenantId && tenantRows[0]?.id) setAccountTenantId(tenantRows[0].id);
    if (!configTenantId && tenantRows[0]?.id) setConfigTenantId(tenantRows[0].id);
  }

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      const activeSession = await requireSession();
      if (!activeSession) return;
      await loadTenantsAndEvents();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  async function onCreateTenant() {
    setMessage(null);
    setError(null);
    const { response, payload } = await createTenant({
      name: tenantName,
      slug: tenantSlug || undefined,
      description: tenantDescription || undefined,
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to create tenant");
      return;
    }
    setTenantName("");
    setTenantSlug("");
    setTenantDescription("");
    setMessage(`Created tenant ${(payload as any)?.tenant?.name || ""}`.trim());
    await refreshAll();
  }

  async function onAddMember() {
    setMessage(null);
    setError(null);
    const { response, payload } = await addTenantMember(memberTenantId, {
      email: memberEmail,
      role: memberRole,
      status: "active",
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to add member");
      return;
    }
    setMemberEmail("");
    setMessage(`Added ${(payload as any)?.member?.email || "member"}`);
    await refreshAll();
  }

  async function onAddAccount() {
    setMessage(null);
    setError(null);
    const { response, payload } = await addTenantMetaAccount(accountTenantId, {
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
    setMessage(`Registered ${(payload as any)?.account?.accountId || "account"}`);
    await refreshAll();
  }

  async function onSaveConfig() {
    setMessage(null);
    setError(null);
    const { response, payload } = await putTenantConfig(configTenantId, {
      component: configComponent,
      key: configKey,
      value: parseConfigInput(configValue),
      isSecret: configSecret,
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to save config");
      return;
    }
    setMessage(`Saved ${configComponent}:${configKey}`);
    await refreshAll();
  }

  async function onInspectEvent(eventId: string) {
    const { response, payload } = await getMetaWebhookEvent(eventId);
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to load event");
      return;
    }
    setSelectedEvent(payload?.event || null);
  }

  async function onRecover(input: { eventIds?: string[]; tenantId?: string; sourceAccountId?: string; limit?: number }) {
    setMessage(null);
    setError(null);
    const { response, payload } = await recoverMetaWebhookEvents(input);
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to recover events");
      return;
    }
    setMessage(`Replayed ${(payload?.replayed || []).length} event(s)`);
    await refreshAll();
  }

  return (
    <Shell
      eyebrow="brain-admin.omattic.com"
      title="Operate tenants, webhook recovery, and live component config."
      description="The admin surface now uses the shared auth session, serves a real SPA through Cloudflare ASSETS, and drives tenant-aware Meta runtime behavior through D1 plus KV."
      actions={
        <>
          <Button variant="secondary" className="gap-2" onClick={() => void refreshAll()}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <a href={getLogoutUrl(redirectUri)}>
            <Button variant="secondary" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </a>
        </>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Session</Badge>
            {session ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Authenticated</Badge> : null}
          </div>
          {session ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Signed in
              </div>
              <p><strong>Name:</strong> {session.name || "n/a"}</p>
              <p><strong>Email:</strong> {session.email}</p>
              <p><strong>Domain:</strong> {session.domain || "n/a"}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{loading ? "Checking session..." : "Redirecting to auth..."}</p>
          )}
          {message ? <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}
          {error ? <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
        </Card>

        <Card className="space-y-4">
          <Badge>Summary</Badge>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tenants</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{tenants.length}</div>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Failed Events</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{events.length}</div>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Meta Accounts</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{tenants.reduce((sum, tenant) => sum + tenant.metaAccounts.length, 0)}</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Create</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Tenant</h2>
          </div>
          <Input placeholder="Ingles Con Liza" value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
          <Input placeholder="ingles-con-liza" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} />
          <Textarea placeholder="Primary tenant for Instagram automation" value={tenantDescription} onChange={(event) => setTenantDescription(event.target.value)} />
          <Button onClick={() => void onCreateTenant()}>Create Tenant</Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Members</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Invite by Email</h2>
          </div>
          <select className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={memberTenantId} onChange={(event) => setMemberTenantId(event.target.value)}>
            <option value="">Select tenant</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
          <Input placeholder="ops@omattic.com" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
          <Input placeholder="admin" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} />
          <Button onClick={() => void onAddMember()} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Meta</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Account Mapping</h2>
          </div>
          <select className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={accountTenantId} onChange={(event) => setAccountTenantId(event.target.value)}>
            <option value="">Select tenant</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
          <Input placeholder="instagram" value={accountProvider} onChange={(event) => setAccountProvider(event.target.value)} />
          <Input placeholder="17841401707784079" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
          <Input placeholder="inglesconliza" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} />
          <Button onClick={() => void onAddAccount()}>Register Account</Button>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.85fr,1.15fr]">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Config</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Tenant Runtime Config</h2>
          </div>
          <select className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={configTenantId} onChange={(event) => setConfigTenantId(event.target.value)}>
            <option value="">Select tenant</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
          <Input value={configComponent} onChange={(event) => setConfigComponent(event.target.value)} />
          <Input value={configKey} onChange={(event) => setConfigKey(event.target.value)} />
          <Textarea value={configValue} onChange={(event) => setConfigValue(event.target.value)} />
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={configSecret} onChange={(event) => setConfigSecret(event.target.checked)} />
            Treat value as secret metadata
          </label>
          <Button onClick={() => void onSaveConfig()}>Save Config</Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Tenants</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Current State</h2>
          </div>
          <div className="grid gap-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-950">{tenant.name}</div>
                    <div className="text-sm text-slate-500">{tenant.slug}</div>
                  </div>
                  <Badge>{tenant.status}</Badge>
                </div>
                <p className="mb-4 text-sm text-slate-600">{tenant.description || "No description."}</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Members</div>
                    <div className="space-y-2 text-sm text-slate-700">
                      {tenant.members.length ? tenant.members.map((member) => (
                        <div key={member.id}>{member.email} · {member.role}</div>
                      )) : <div className="text-slate-400">No members yet.</div>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Meta Accounts</div>
                    <div className="space-y-2 text-sm text-slate-700">
                      {tenant.metaAccounts.length ? tenant.metaAccounts.map((account) => (
                        <div key={account.id}>{account.username || account.accountId} · {account.accountId}</div>
                      )) : <div className="text-slate-400">No accounts yet.</div>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Config</div>
                    <div className="space-y-2 text-sm text-slate-700">
                      {tenant.configs.length ? tenant.configs.map((config) => (
                        <div key={config.id}>{config.component}:{config.key}</div>
                      )) : <div className="text-slate-400">No config yet.</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!tenants.length && !loading ? <div className="text-sm text-slate-500">No tenants yet.</div> : null}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge>Monitoring</Badge>
              <h2 className="text-xl font-semibold text-slate-950">Failed Meta Events</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void refreshAll()}>Refresh</Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={() =>
                  void onRecover({
                    tenantId: filterTenantId || undefined,
                    sourceAccountId: filterAccountId || undefined,
                    limit: Number(filterLimit || "25"),
                  })
                }
              >
                <RotateCcw className="h-4 w-4" />
                Recover Visible
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={filterTenantId} onChange={(event) => setFilterTenantId(event.target.value)}>
              <option value="">All tenants</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
            <Input placeholder="Source account id" value={filterAccountId} onChange={(event) => setFilterAccountId(event.target.value)} />
            <Input placeholder="25" value={filterLimit} onChange={(event) => setFilterLimit(event.target.value)} />
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{event.tenantName || "Unmapped tenant"}</div>
                    <div className="text-sm text-slate-500">{event.metaAccountUsername || event.sourceAccountId || "unknown account"}</div>
                  </div>
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700">{event.status}</Badge>
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  <div><strong>Updated:</strong> {formatDateTime(event.updatedAt)}</div>
                  <div><strong>Error:</strong> {event.errorMessage || "n/a"}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" className="gap-2" onClick={() => void onInspectEvent(event.id)}>
                    <Webhook className="h-4 w-4" />
                    Inspect
                  </Button>
                  <Button variant="danger" onClick={() => void onRecover({ eventIds: [event.id] })}>Replay One</Button>
                </div>
              </div>
            ))}
            {!events.length && !loading ? <div className="text-sm text-slate-500">No failed events for the current filters.</div> : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>Inspect</Badge>
            <h2 className="text-xl font-semibold text-slate-950">Event Payload</h2>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <pre className="overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-800">
              {selectedEvent ? formatJson(selectedEvent) : "Select an event to inspect it here."}
            </pre>
          </div>
        </Card>
      </section>
    </Shell>
  );
}
