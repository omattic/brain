import { CreditCard, Settings2, Users } from "lucide-react";
import { TenantPickerPage } from "@/pages/tenant-picker-page";
import { useDashboard } from "@/lib/dashboard-context";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function SettingsPage() {
  const { selectedTenant } = useDashboard();

  if (!selectedTenant) {
    return <TenantPickerPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title={selectedTenant.name}
        description="Tenant metadata, members, Meta accounts, and runtime configuration currently visible to your account."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Members</div>
          </div>
          <div className="space-y-3">
            {selectedTenant.members.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="truncate text-sm font-medium text-slate-950">{member.email}</div>
                <div className="mt-2 flex gap-2">
                  <Badge>{member.role}</Badge>
                  <Badge className="bg-slate-100 text-slate-700">{member.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Meta accounts
            </div>
          </div>
          <div className="space-y-3">
            {selectedTenant.metaAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="truncate text-sm font-medium text-slate-950">
                  {account.username || account.accountId}
                </div>
                <div className="mt-1 text-xs text-slate-500">{account.provider} · {account.accountId}</div>
              </div>
            ))}
            {!selectedTenant.metaAccounts.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-sm text-slate-500">
                No Meta accounts have been mapped to this tenant yet.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Config</div>
          </div>
          <div className="space-y-3">
            {selectedTenant.configs.map((config) => (
              <div key={config.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-sm font-medium text-slate-950">{config.component}:{config.key}</div>
                <div className="mt-1 text-xs text-slate-500">Updated {formatDateTime(config.updatedAt)}</div>
                <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-700">
                  {typeof config.parsedValue === "string"
                    ? config.parsedValue
                    : JSON.stringify(config.parsedValue, null, 2)}
                </pre>
              </div>
            ))}
            {!selectedTenant.configs.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-sm text-slate-500">
                No tenant config has been written yet.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
