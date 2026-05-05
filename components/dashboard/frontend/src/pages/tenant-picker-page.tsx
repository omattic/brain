import { ArrowRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/lib/dashboard-context";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TenantPickerPage() {
  const { loading, tenants, selectTenant, tenantAccess } = useDashboard();
  const navigate = useNavigate();

  function openTenant(tenantId: string) {
    selectTenant(tenantId);
    navigate("/ig-hashtags");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Select a tenant"
        description="Choose the tenant workspace you want to configure. If your account only has one tenant, the dashboard opens it automatically."
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading your tenant access...</Card>
      ) : null}

      {!loading && !tenants.length ? (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              No tenant access
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Your Google account authenticated successfully, but it is not assigned to any active tenant yet.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4">
        {tenants.map((tenant) => {
          const access = tenantAccess.find((entry) => entry.tenantId === tenant.id);
          return (
            <Card key={tenant.id} className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xl font-semibold tracking-tight text-foreground">{tenant.name}</div>
                    <Badge>{tenant.status}</Badge>
                    {access ? <Badge className="bg-slate-100 text-slate-700">{access.role}</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{tenant.slug}</div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {tenant.description || "No description provided."}
                  </p>
                </div>
                <Button className="gap-2" onClick={() => openTenant(tenant.id)}>
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Members
                  </div>
                  <div className="text-2xl font-semibold text-slate-950">{tenant.members.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Meta accounts
                  </div>
                  <div className="space-y-1">
                    {tenant.metaAccounts.slice(0, 2).map((account) => (
                      <div key={account.id} className="truncate text-sm font-medium text-slate-900">
                        {account.username || account.accountId}
                      </div>
                    ))}
                    {!tenant.metaAccounts.length ? (
                      <div className="text-sm text-slate-400">No accounts mapped yet.</div>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Runtime config
                  </div>
                  <div className="text-sm text-slate-500">
                    {tenant.configs.length
                      ? `Updated ${formatDateTime(tenant.configs[0]?.updatedAt)}`
                      : "No config written yet."}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
