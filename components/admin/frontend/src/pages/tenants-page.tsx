import { useState } from "react";
import { ArrowRight, Building2, CreditCard, Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { addTenantMember, addTenantMetaAccount, createTenant } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TenantsPage() {
  const { session, tenants, refreshWorkspace, setError, setSuccess } = useAdmin();
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

  async function onCreateTenant() {
    setSuccess(null);
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
    setSuccess(`Created tenant ${(payload as any)?.tenant?.name || ""}`.trim());
    await refreshWorkspace();
  }

  async function onAddMember() {
    setSuccess(null);
    setError(null);
    const targetTenantId = memberTenantId || firstTenantId;
    const { response, payload } = await addTenantMember(targetTenantId, {
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
    await refreshWorkspace();
  }

  async function onAddAccount() {
    setSuccess(null);
    setError(null);
    const targetTenantId = accountTenantId || firstTenantId;
    const { response, payload } = await addTenantMetaAccount(targetTenantId, {
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
    await refreshWorkspace();
  }

  const firstTenantId = tenants[0]?.id || "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenants"
        title="Provision and manage tenant workspaces"
        description="Create tenants, seed memberships, and map Meta accounts without leaving the admin surface."
      />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">New tenant</div>
          </div>
          {session?.isSuperAdmin ? (
            <div className="space-y-3">
              <Input placeholder="Ingles Con Liza" value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
              <Input placeholder="ingles-con-liza" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} />
              <Textarea
                placeholder="Primary tenant for Instagram automation"
                value={tenantDescription}
                onChange={(event) => setTenantDescription(event.target.value)}
              />
              <Button className="w-full gap-2" onClick={() => void onCreateTenant()}>
                <Plus className="h-4 w-4" />
                Create tenant
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
              Only the super-admin can create the first tenant workspaces.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Add member</div>
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
                    <Button className="w-full gap-2" onClick={() => void onAddMember()} disabled={!firstTenantId}>
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
            <CreditCard className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Meta account</div>
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
            <Button className="w-full gap-2" onClick={() => void onAddAccount()} disabled={!firstTenantId}>
              <CreditCard className="h-4 w-4" />
              Register account
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-semibold tracking-tight text-slate-950">{tenant.name}</div>
                  <Badge>{tenant.status}</Badge>
                </div>
                <div className="mt-1 text-sm text-slate-500">{tenant.slug}</div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {tenant.description || "No description provided."}
                </p>
              </div>
              <Link to={`/tenants/${tenant.id}`}>
                <Button variant="secondary" className="gap-2">
                  Open details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Members</div>
                <div className="space-y-2">
                  {tenant.members.length ? (
                    tenant.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                        <span className="truncate">{member.email}</span>
                        <span className="text-slate-500">{member.role}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No members yet.</div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Meta accounts</div>
                <div className="space-y-2">
                  {tenant.metaAccounts.length ? (
                    tenant.metaAccounts.slice(0, 3).map((account) => (
                      <div key={account.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                        <div className="font-medium text-slate-900">{account.username || account.accountId}</div>
                        <div className="text-xs text-slate-500">{account.accountId}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No Meta accounts yet.</div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Runtime config</div>
                <div className="space-y-2">
                  {tenant.configs.length ? (
                    tenant.configs.slice(0, 3).map((config) => (
                      <div key={config.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                        <div className="font-medium text-slate-900">{config.component}:{config.key}</div>
                        <div className="text-xs text-slate-500">
                          {config.isSecret ? "Secret-aware" : "Visible"} · Updated {formatDateTime(config.updatedAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No config yet.</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
