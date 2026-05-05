import { useEffect, useState } from "react";
import { AlertCircle, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { getFailedEvents, getMetaWebhookEvent, recoverMetaWebhookEvents } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import type { MetaWebhookEvent } from "@/lib/types";
import { formatDateTime, formatJson } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function MonitoringPage() {
  const { tenants, refreshWorkspace, setError, setSuccess } = useAdmin();
  const [events, setEvents] = useState<MetaWebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MetaWebhookEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTenantId, setFilterTenantId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterLimit, setFilterLimit] = useState("25");

  async function loadEvents() {
    setLoading(true);
    const { response, payload } = await getFailedEvents({
      tenantId: filterTenantId || undefined,
      sourceAccountId: filterAccountId || undefined,
      limit: Number(filterLimit || "25"),
    });
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to load failed events");
      setLoading(false);
      return;
    }
    setEvents(payload?.events || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadEvents();
  }, []);

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
    setSuccess(null);
    setError(null);
    const { response, payload } = await recoverMetaWebhookEvents(input);
    if (!response.ok) {
      setError((payload as any)?.error || "Unable to recover events");
      return;
    }
    setSuccess(`Replayed ${(payload?.replayed || []).length} event(s)`);
    await Promise.all([loadEvents(), refreshWorkspace()]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrastructure Logs"
        description="Real-time system events, API audits, and Brain activity."
        actions={
          <>
            <Button variant="secondary" className="gap-2" onClick={() => void loadEvents()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
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
          </>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[1.18fr,0.82fr]">
        <Card className="space-y-5">
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
            <Input placeholder="25" value={filterLimit} onChange={(event) => setFilterLimit(event.target.value)} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.2fr,1fr,0.9fr,0.9fr,0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
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

        <Card className="space-y-5">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Payload</div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Selected event</div>
          <div className="rounded-2xl border border-slate-200 bg-[#0a2540] p-4">
            <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-100">
              {selectedEvent ? formatJson(selectedEvent) : "Select an event from the queue to inspect it here."}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
