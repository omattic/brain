import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Gauge,
  LogOut,
  Menu,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { getLogoutUrl } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
  caption: string;
};

const navigation: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: Gauge,
    caption: "Workspace summary, posture, and access state.",
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Building2,
    caption: "Provision tenants, members, accounts, and runtime config.",
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: Webhook,
    caption: "Inspect and replay failed Meta webhook events.",
  },
];

const routeLabels: Array<{ test: (pathname: string) => boolean; label: string }> = [
  { test: (pathname) => pathname === "/", label: "Overview" },
  { test: (pathname) => pathname.startsWith("/tenants/"), label: "Tenant Details" },
  { test: (pathname) => pathname.startsWith("/tenants"), label: "Tenants" },
  { test: (pathname) => pathname.startsWith("/monitoring"), label: "Monitoring" },
];

function SidebarItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
          isActive
            ? "border-[#635bff]/20 bg-[#f5f7ff] shadow-[0_8px_24px_rgba(99,91,255,0.10)]"
            : "border-slate-200/80 bg-white hover:bg-slate-50"
        )
      }
      end={item.href === "/"}
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              "mt-0.5 rounded-xl p-2",
              isActive ? "bg-[#635bff] text-white" : "bg-[#f4f5ff] text-[#635bff]"
            )}
          >
            <item.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className={cn("text-sm font-medium", isActive ? "text-slate-950" : "text-slate-900")}>
              {item.label}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{item.caption}</div>
          </div>
        </>
      )}
    </NavLink>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { session, banner } = useAdmin();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const redirectUri = useMemo(() => window.location.href, []);
  const routeLabel = routeLabels.find((entry) => entry.test(location.pathname))?.label || "Admin";

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
            <Menu className="h-4 w-4" />
            Sections
          </button>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            {routeLabel}
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/40 xl:hidden">
            <div className="absolute inset-y-0 left-0 w-[88%] max-w-[340px] bg-[#f6f9fc] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Workspace sections</div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {navigation.map((item) => (
                  <SidebarItem key={item.href} item={item} onNavigate={() => setMobileOpen(false)} />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr)]">
          <aside className="hidden space-y-4 xl:block xl:sticky xl:top-4 xl:self-start">
            <Card className="rounded-[24px] bg-[#0a2540] p-5 text-white shadow-[0_18px_50px_rgba(10,37,64,0.26)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck className="h-5 w-5" />
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

            <div className="space-y-3">
              {navigation.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            <header className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    brain-admin.omattic.com
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{routeLabel}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {session?.name || session?.email || "Loading session..."}
                  </div>
                  <a href={getLogoutUrl(redirectUri)}>
                    <Button variant="secondary" className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </a>
                </div>
              </div>
              {banner ? (
                <div
                  className={cn(
                    "mt-4 rounded-2xl border px-4 py-3 text-sm",
                    banner.kind === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  )}
                >
                  {banner.message}
                </div>
              ) : null}
            </header>

            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
