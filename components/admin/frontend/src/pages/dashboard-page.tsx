import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CreditCard,
  Gauge,
  Layers3,
  LogOut,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
  Webhook,
} from "lucide-react";
import {
  addTenantMember,
  addTenantMetaAccount,
  createTenant,
  getFailedEvents,
  getLoginUrl,
  getLogoutUrl,
  getMetaWebhookEvent,
  getSession,
  getTenants,
  putTenantConfig,
  recoverMetaWebhookEvents,
} from "@/lib/api";
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

function SidebarItem({
  icon,
  label,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="mt-0.5 rounded-xl bg-[#f4f5ff] p-2 text-[#635bff]">{icon}</div>
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{caption}</div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="rounded-2xl px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{hint}</div>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          {badge ? <Badge>{badge}</Badge> : null}
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
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
  const totalMembers = useMemo(
    () => tenants.reduce((sum, tenant) => sum + tenant.members.length, 0),
    [tenants]
  );
  const totalAccounts = useMemo(
    () => tenants.reduce((sum, tenant) => sum + tenant.metaAccounts.length, 0),
    [tenants]
  );
  const totalConfigs = useMemo(
    () => tenants.reduce((sum, tenant) => sum + tenant.configs.length, 0),
    [tenants]
  );

  async function requireSession() {
    const { response, payload } = await getSession();
    if (response.ok && payload?.authenticated && payload.user) {
      const nextSession = {
        ...payload.user,
        isSuperAdmin: Boolean(payload.isSuperAdmin),
        tenantIds: payload.tenantIds || [],
      };
      setSession(nextSession);
      return nextSession;
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

  async function onRecover(input: {
    eventIds?: string[];
    tenantId?: string;
    sourceAccountId?: string;
    limit?: number;
  }) {
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
      title="Control tenants, credentials, and webhook recovery from one operations plane."
      description="A calmer, denser workspace for managing tenant runtime state, Meta account mappings, and failed event recovery without leaving the admin surface."
      actions={
        <>
          <Button variant="secondary" className="gap-2" onClick={() => void refreshAll()}>
            <RefreshCcw className="h-4 w-4" />
            Refresh data
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
      <div className="grid gap-6 xl:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-[24px] bg-[#0a2540] p-5 text-white shadow-[0_18px_50px_rgba(10,37,64,0.26)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-white/70">Operations</div>
                <div className="text-xl font-semibold tracking-tight">Brain Admin</div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-white/55">Authenticated as</div>
              <div className="mt-2 text-sm font-medium">{session?.email || "Checking session..."}</div>
              <div className="mt-1 text-xs text-white/60">
                {session?.isSuperAdmin ? "Super-admin access" : "Tenant-scoped access"}
              </div>
            </div>
          </Card>

          <SidebarItem
            icon={<Building2 className="h-4 w-4" />}
            label="Tenants"
            caption="Create and inspect active tenant workspaces."
          />
          <SidebarItem
            icon={<Users className="h-4 w-4" />}
            label="Members"
            caption="Manage who can read or write within each tenant."
          />
          <SidebarItem
            icon={<CreditCard className="h-4 w-4" />}
            label="Meta Accounts"
            caption="Map Instagram accounts into the tenant runtime graph."
          />
          <SidebarItem
            icon={<Settings2 className="h-4 w-4" />}
            label="Runtime Config"
            caption="Write tenant-aware config that flows into KV-backed runtime reads."
          />
          <SidebarItem
            icon={<Webhook className="h-4 w-4" />}
            label="Monitoring"
            caption="Inspect and replay failed inbound Meta webhook events."
          />
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard label="Tenants" value={tenants.length} hint="Provisioned workspaces in the current view." />
            <MetricCard label="Members" value={totalMembers} hint="Assigned operators across visible tenants." />
            <MetricCard label="Meta Accounts" value={totalAccounts} hint="Bound accounts currently mapped into tenant runtime." />
            <MetricCard label="Failed Events" value={events.length} hint="Webhook failures waiting for inspection or replay." />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.15fr,0.85fr]">
            <Card className="space-y-5">
              <SectionHeader
                badge="Access"
                title="Session and permissions"
                description="The dashboard uses the shared Omattic auth session. Super-admin keeps global control while tenant members stay inside their scoped workspaces."
              />
              <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
                  <div className="mb-3 flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Session active
                  </div>
                  <div><strong>Name:</strong> {session?.name || "n/a"}</div>
                  <div><strong>Email:</strong> {session?.email || "n/a"}</div>
                  <div><strong>Mode:</strong> {session?.isSuperAdmin ? "Super-admin" : "Tenant member"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
                  <div className="mb-3 font-semibold text-slate-900">Current feedback</div>
                  {message ? <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-emerald-700">{message}</div> : null}
                  {error ? <div className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-rose-700">{error}</div> : null}
                  {!message && !error ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500">
                      {loading ? "Loading workspace state..." : "No alerts right now."}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <SectionHeader
                badge="Search"
                title="Failure filters"
                description="Narrow the replay queue by tenant, source account, or result count before inspecting payloads."
                actions={
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
                    Recover visible
                  </Button>
                }
              />
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                  value={filterTenantId}
                  onChange={(event) => setFilterTenantId(event.target.value)}
                >
                  <option value="">All tenants</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Source account id"
                    value={filterAccountId}
                    onChange={(event) => setFilterAccountId(event.target.value)}
                  />
                </div>
                <Input
                  placeholder="25"
                  value={filterLimit}
                  onChange={(event) => setFilterLimit(event.target.value)}
                />
              </div>
            </Card>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[0.92fr,1.08fr]">
            <Card className="space-y-5">
              <SectionHeader
                badge="Tenants"
                title="Provisioning"
                description="Create tenants, seed users, and wire runtime accounts with a more operational, less chatty flow."
              />

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Building2 className="h-4 w-4 text-[#635bff]" />
                    New tenant
                  </div>
                  {session?.isSuperAdmin ? (
                    <div className="space-y-3">
                      <Input placeholder="Ingles Con Liza" value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
                      <Input placeholder="ingles-con-liza" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} />
                      <Textarea placeholder="Primary tenant for Instagram automation" value={tenantDescription} onChange={(event) => setTenantDescription(event.target.value)} />
                      <Button className="w-full" onClick={() => void onCreateTenant()}>
                        Create tenant
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm leading-6 text-slate-500">Only the super-admin can create the first tenant workspaces.</div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserPlus className="h-4 w-4 text-[#635bff]" />
                    Add member
                  </div>
                  {session?.isSuperAdmin ? (
                    <div className="space-y-3">
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                        value={memberTenantId}
                        onChange={(event) => setMemberTenantId(event.target.value)}
                      >
                        <option value="">Select tenant</option>
                        {tenants.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </option>
                        ))}
                      </select>
                      <Input placeholder="ops@omattic.com" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
                      <Input placeholder="admin" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} />
                      <Button className="w-full" onClick={() => void onAddMember()}>
                        Add member
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm leading-6 text-slate-500">Membership creation stays reserved for the super-admin.</div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard className="h-4 w-4 text-[#635bff]" />
                    Meta account
                  </div>
                  <div className="space-y-3">
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                      value={accountTenantId}
                      onChange={(event) => setAccountTenantId(event.target.value)}
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                    <Input placeholder="instagram" value={accountProvider} onChange={(event) => setAccountProvider(event.target.value)} />
                    <Input placeholder="17841401707784079" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
                    <Input placeholder="inglesconliza" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} />
                    <Button className="w-full" onClick={() => void onAddAccount()}>
                      Register account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <SectionHeader
                badge="Workspace"
                title="Active tenants"
                description="A denser overview of memberships, Meta accounts, and runtime config attached to each visible tenant."
              />
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold tracking-tight text-slate-950">{tenant.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{tenant.slug}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge>{tenant.status}</Badge>
                        {session?.isSuperAdmin ? (
                          <Badge className="border-[#c7d2fe] bg-[#eef2ff] text-[#4f46e5]">Super-admin</Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{tenant.description || "No description provided."}</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Members</div>
                        <div className="space-y-2 text-sm text-slate-700">
                          {tenant.members.length ? tenant.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                              <span className="truncate">{member.email}</span>
                              <span className="text-slate-500">{member.role}</span>
                            </div>
                          )) : <div className="text-slate-400">No members yet.</div>}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Meta accounts</div>
                        <div className="space-y-2 text-sm text-slate-700">
                          {tenant.metaAccounts.length ? tenant.metaAccounts.map((account) => (
                            <div key={account.id} className="rounded-xl bg-white px-3 py-2">
                              <div className="font-medium text-slate-900">{account.username || account.accountId}</div>
                              <div className="text-xs text-slate-500">{account.accountId}</div>
                            </div>
                          )) : <div className="text-slate-400">No accounts yet.</div>}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Runtime config</div>
                        <div className="space-y-2 text-sm text-slate-700">
                          {tenant.configs.length ? tenant.configs.map((config) => (
                            <div key={config.id} className="rounded-xl bg-white px-3 py-2">
                              <div className="font-medium text-slate-900">{config.component}:{config.key}</div>
                              <div className="text-xs text-slate-500">
                                {config.isSecret ? "Secret-aware" : "Visible"} · Updated {formatDateTime(config.updatedAt)}
                              </div>
                            </div>
                          )) : <div className="text-slate-400">No config yet.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!tenants.length && !loading ? <div className="text-sm text-slate-500">No tenants in scope.</div> : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[0.78fr,1.22fr]">
            <Card className="space-y-5">
              <SectionHeader
                badge="Config"
                title="Tenant runtime config"
                description="Write values the runtime can resolve directly from D1-backed KV cache without redeploying workers."
              />
              <div className="space-y-3">
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                  value={configTenantId}
                  onChange={(event) => setConfigTenantId(event.target.value)}
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <Input value={configComponent} onChange={(event) => setConfigComponent(event.target.value)} />
                <Input value={configKey} onChange={(event) => setConfigKey(event.target.value)} />
                <Textarea value={configValue} onChange={(event) => setConfigValue(event.target.value)} />
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={configSecret} onChange={(event) => setConfigSecret(event.target.checked)} />
                  Treat this value as secret metadata in the admin layer
                </label>
                <Button className="w-full" onClick={() => void onSaveConfig()}>
                  Save config
                </Button>
              </div>
            </Card>

            <Card className="space-y-5">
              <SectionHeader
                badge="Monitoring"
                title="Failed Meta event queue"
                description="Stripe-like operations table for triage: inspect source account, exception state, and replay individual failures without leaving the screen."
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr,1fr,0.9fr,0.9fr,0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <div>Tenant</div>
                  <div>Account</div>
                  <div>Updated</div>
                  <div>Error</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y divide-slate-200 bg-white">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-slate-700 lg:grid-cols-[1.2fr,1fr,0.9fr,0.9fr,0.8fr] lg:items-start"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{event.tenantName || "Unmapped tenant"}</div>
                        <div className="mt-1 text-xs text-slate-500">{event.id}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{event.metaAccountUsername || "unknown"}</div>
                        <div className="mt-1 text-xs text-slate-500">{event.sourceAccountId || "n/a"}</div>
                      </div>
                      <div className="text-slate-600">{formatDateTime(event.updatedAt)}</div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-rose-500" />
                        <span className="line-clamp-3">{event.errorMessage || "n/a"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => void onInspectEvent(event.id)}>
                          Inspect
                        </Button>
                        <Button variant="danger" onClick={() => void onRecover({ eventIds: [event.id] })}>
                          Replay
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!events.length && !loading ? (
                    <div className="px-4 py-8 text-sm text-slate-500">No failed events for the current filters.</div>
                  ) : null}
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <Card className="space-y-5">
              <SectionHeader
                badge="Payload"
                title="Selected event"
                description="Inspect the exact stored event body before replaying or mapping the failure back to tenant configuration."
              />
              <div className="rounded-2xl border border-slate-200 bg-[#0a2540] p-4">
                <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
                  {selectedEvent ? formatJson(selectedEvent) : "Select an event from the table above to inspect it here."}
                </pre>
              </div>
            </Card>

            <Card className="space-y-5">
              <SectionHeader
                badge="Runtime"
                title="Configuration posture"
                description="A quick operational picture of how many runtime records are active in the currently visible tenant scope."
              />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Layers3 className="h-4 w-4 text-[#635bff]" />
                    Config entries
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">{totalConfigs}</div>
                  <div className="mt-2 text-sm text-slate-500">Tenant values currently mirrored into runtime cache.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Users className="h-4 w-4 text-[#635bff]" />
                    Memberships
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">{totalMembers}</div>
                  <div className="mt-2 text-sm text-slate-500">Visible operators with tenant-scoped access.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Webhook className="h-4 w-4 text-[#635bff]" />
                    Replayable
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">{events.length}</div>
                  <div className="mt-2 text-sm text-slate-500">Failures currently eligible for replay from this view.</div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </Shell>
  );
}
