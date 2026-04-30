import { AlertCircle, Layers3, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { useAdmin } from "@/lib/admin-context";

export function OverviewPage() {
  const { session, tenants, failedEvents, loading } = useAdmin();

  const totalMembers = tenants.reduce((sum, tenant) => sum + tenant.members.length, 0);
  const totalAccounts = tenants.reduce((sum, tenant) => sum + tenant.metaAccounts.length, 0);
  const totalConfigs = tenants.reduce((sum, tenant) => sum + tenant.configs.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Tenant operations at a glance"
        description="The current workspace state across tenants, Meta account mappings, runtime config, and recovery posture."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tenants" value={tenants.length} hint="Visible workspaces in scope." />
        <StatCard label="Members" value={totalMembers} hint="Operators attached to visible tenants." />
        <StatCard label="Meta Accounts" value={totalAccounts} hint="Mapped accounts feeding runtime routing." />
        <StatCard label="Failed Events" value={failedEvents.length} hint="Queued failures awaiting triage." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Access</div>
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Session and permissions</div>
          <p className="text-sm leading-6 text-slate-500">
            This workspace runs on the shared Omattic auth session. Super-admin has global control; everyone else stays tenant-scoped.
          </p>
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
              <div className="mb-3 font-semibold text-slate-900">Workspace status</div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500">
                {loading ? "Loading workspace state..." : "Admin workspace synchronized."}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Posture</div>
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Runtime footprint</div>
          <p className="text-sm leading-6 text-slate-500">
            A quick operational picture of the currently loaded tenant scope.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Layers3 className="h-4 w-4 text-[#635bff]" />
                Config entries
              </div>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{totalConfigs}</div>
              <div className="mt-2 text-sm text-slate-500">Tenant runtime settings currently cached for the workers.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Replayable failures
              </div>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{failedEvents.length}</div>
              <div className="mt-2 text-sm text-slate-500">Failures currently eligible for direct replay from admin.</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#635bff]" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Tenants</div>
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Recent workspace scope</div>
          <div className="space-y-3">
            {tenants.slice(0, 4).map((tenant) => (
              <div key={tenant.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-950">{tenant.name}</div>
                <div className="mt-1 text-xs text-slate-500">{tenant.slug}</div>
              </div>
            ))}
            {!tenants.length && !loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No tenants are visible in the current scope.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recovery</div>
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Failed event snapshot</div>
          <div className="space-y-3">
            {failedEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-950">{event.tenantName || "Unmapped tenant"}</div>
                <div className="mt-1 text-xs text-slate-500">{event.metaAccountUsername || event.sourceAccountId || "unknown source"}</div>
                <div className="mt-2 text-sm text-slate-600">{event.errorMessage || "No error message recorded."}</div>
              </div>
            ))}
            {!failedEvents.length && !loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No failed Meta webhook events in the current default view.
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
