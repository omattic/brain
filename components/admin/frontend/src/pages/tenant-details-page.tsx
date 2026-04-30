import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, Save, Settings2, UserPlus, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { addTenantMember, addTenantMetaAccount, getTenant, putTenantConfig } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import type { Tenant } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DetailTab = "members" | "accounts" | "config";

export function TenantDetailsPage() {
  const { tenantId } = useParams();
  const { session, refreshWorkspace, setError, setSuccess } = useAdmin();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("members");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("admin");
  const [accountProvider, setAccountProvider] = useState("instagram");
  const [accountId, setAccountId] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [configComponent, setConfigComponent] = useState("meta");
  const [configKey, setConfigKey] = useState("INSTAGRAM_RESPONSE_PROFILE");
  const [configValue, setConfigValue] = useState("\"inglesconliza\"");
  const [configSecret, setConfigSecret] = useState(false);

  const canWriteTenant = useMemo(() => {
    if (session?.isSuperAdmin) return true;
    const membership = tenant?.members.find((entry) => entry.email === session?.email && entry.status === "active");
    if (!membership) return false;
    return ["owner", "admin", "editor"].includes(membership.role.toLowerCase());
  }, [session, tenant]);

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
    setTenant(payload?.tenant || null);
    setLoading(false);
  }

  useEffect(() => {
    void loadTenant();
  }, [tenantId]);

  function parseConfigInput(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async function onAddMember() {
    if (!tenantId) return;
    setSuccess(null);
    setError(null);
    const { response, payload } = await addTenantMember(tenantId, {
      email: memberEmail,
      role: memberRole,
      status: "active",
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to add member");
      return;
    }
    setMemberEmail("");
    setSuccess(`Added ${(payload as any)?.member?.email || "member"}`);
    await Promise.all([loadTenant(), refreshWorkspace()]);
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
    await Promise.all([loadTenant(), refreshWorkspace()]);
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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to tenants
        </Link>
      </div>

      <PageHeader
        eyebrow="Tenant Details"
        title={tenant?.name || (loading ? "Loading tenant..." : "Tenant not found")}
        description={tenant?.description || "Inspect memberships, Meta accounts, and runtime configuration for this tenant."}
        actions={
          tenant ? (
            <div className="flex items-center gap-2">
              <Badge>{tenant.status}</Badge>
              <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">{tenant.slug}</Badge>
            </div>
          ) : null
        }
      />

      {tenant ? (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "members" as const, label: "Members", icon: Users },
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

          {activeTab === "members" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Add member</div>
                </div>
                {session?.isSuperAdmin ? (
                  <div className="space-y-3">
                    <Input placeholder="ops@omattic.com" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
                    <Input placeholder="admin" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} />
                    <Button className="w-full gap-2" onClick={() => void onAddMember()}>
                      <UserPlus className="h-4 w-4" />
                      Add member
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                    Membership creation stays reserved for the super-admin.
                  </div>
                )}
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant members</div>
                </div>
                <div className="space-y-3">
                  {tenant.members.length ? tenant.members.map((member) => (
                    <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-950">{member.email}</div>
                          <div className="mt-1 text-xs text-slate-500">Joined {formatDateTime(member.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{member.role}</Badge>
                          <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">{member.status}</Badge>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                      No members have been assigned yet.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}

          {activeTab === "accounts" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Register account</div>
                </div>
                {canWriteTenant ? (
                  <div className="space-y-3">
                    <Input placeholder="instagram" value={accountProvider} onChange={(event) => setAccountProvider(event.target.value)} />
                    <Input placeholder="17841401707784079" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
                    <Input placeholder="inglesconliza" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} />
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

              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#635bff]" />
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Mapped accounts</div>
                </div>
                <div className="space-y-3">
                  {tenant.metaAccounts.length ? tenant.metaAccounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-950">{account.username || account.accountId}</div>
                          <div className="mt-1 text-xs text-slate-500">{account.provider} · {account.accountId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{account.status}</Badge>
                          {account.label ? <Badge className="border-[#e2e8f0] bg-slate-100 text-slate-700">{account.label}</Badge> : null}
                        </div>
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
