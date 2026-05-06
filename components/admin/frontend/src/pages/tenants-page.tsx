import { ArrowRight, Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TenantsPage() {
  const { tenants } = useAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brain Tenants"
        description="Select an Account-owned tenant to manage Brain-specific Meta account mappings, runtime config, and operational state."
        actions={
          <a href="https://account.omattic.com/admin/tenants">
            <Button variant="secondary" className="gap-2">
              Manage in Account
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        }
      />

      <Card className="border-blue-100 bg-blue-50/80 text-sm leading-6 text-blue-900 shadow-none">
        Tenant identity, members, roles, and service links are managed in Account. Brain Admin only stores and edits Brain runtime configuration keyed by the Account tenant ID.
      </Card>

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
                  Open Brain config
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Account tenant</div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="truncate font-mono text-xs">{tenant.id}</div>
                  <div>{tenant.members.length} member{tenant.members.length === 1 ? "" : "s"} managed by Account</div>
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

        {!tenants.length ? (
          <Card className="text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              No Account tenants are currently visible for Brain.
            </div>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
