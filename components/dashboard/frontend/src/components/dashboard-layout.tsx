import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Hash,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getLogoutUrl } from "@/lib/api";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
};

const navigation: NavItem[] = [
  { name: "IG -> Hashtags", href: "/ig-hashtags", icon: Hash },
  { name: "Workspace", href: "/tenants", icon: LayoutDashboard },
];

const internal: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
];

const routeLabels: Array<{ test: (pathname: string) => boolean; label: string }> = [
  { test: (pathname) => pathname === "/", label: "Dashboard" },
  { test: (pathname) => pathname.startsWith("/ig-hashtags"), label: "IG -> Hashtags" },
  { test: (pathname) => pathname.startsWith("/tenants"), label: "Workspace" },
  { test: (pathname) => pathname.startsWith("/settings"), label: "Settings" },
];

function SidebarLink({
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
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          item.disabled && "opacity-60"
        )
      }
      end={item.href === "/"}
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn("h-4 w-4", isActive ? "text-brand" : "text-muted-foreground")} />
          <span>{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { tenants, selectedTenantId, selectTenant } = useDashboard();
  const navigate = useNavigate();

  function onTenantChange(tenantId: string) {
    selectTenant(tenantId || null);
    if (tenantId) {
      navigate("/ig-hashtags");
      onNavigate?.();
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white">
            O
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Omattic</span>
        </div>
      </div>
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </div>
        <select
          value={selectedTenantId || ""}
          onChange={(event) => onTenantChange(event.target.value)}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none"
        >
          <option value="" disabled>
            {tenants.length ? "Select tenant" : "No tenants available"}
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-2">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Main Navigation
          </div>
          <div className="space-y-1">
            {navigation.map((item) => (
              <SidebarLink key={item.name} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div className="mt-6 px-2">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            System
          </div>
          <div className="space-y-1">
            {internal.map((item) => (
              <SidebarLink key={item.name} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-sidebar-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">Tenant systems online</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, selectedTenant, banner } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [env, setEnv] = useState("production");
  const location = useLocation();
  const navigate = useNavigate();
  const redirectUri = useMemo(() => window.location.href, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const routeLabel = routeLabels.find((entry) => entry.test(location.pathname))?.label || "Dashboard";
  const searchValue = location.pathname.startsWith("/ig-hashtags") ? searchParams.get("q") || "" : "";
  const initials = (session?.name || session?.email || "DB")
    .split(/\s|@/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DB";

  function updateSearch(value: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    if (location.pathname.startsWith("/ig-hashtags")) {
      setSearchParams(nextParams, { replace: true });
      return;
    }

    navigate({
      pathname: "/ig-hashtags",
      search: nextParams.toString(),
    });
  }

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground antialiased">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-sidebar md:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-foreground/40 md:hidden">
          <div className="absolute inset-y-0 left-0 w-[18rem] max-w-[86vw] border-r border-border bg-sidebar shadow-card">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64">
        <div className="sticky top-0 z-30 w-full">
          <header
            className={cn(
              "flex h-14 items-center gap-4 border-b bg-background px-4 transition-colors duration-500 sm:px-6",
              env === "sandbox" && "bg-orange-50/50"
            )}
          >
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center gap-4">
              <div className="hidden text-sm font-semibold text-foreground sm:block">{routeLabel}</div>
              <div className="relative hidden w-full max-w-sm lg:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchValue}
                  placeholder="Search hashtags, responses..."
                  className="h-9 w-full border-none bg-secondary pl-8 md:w-[300px] lg:w-[400px]"
                  onChange={(event) => updateSearch(event.target.value)}
                />
              </div>
              {selectedTenant ? (
                <div className="hidden rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground md:block">
                  {selectedTenant.name}
                </div>
              ) : null}
              {env === "sandbox" ? (
                <div className="hidden items-center gap-1.5 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 md:flex">
                  <ShieldAlert className="h-3 w-3" />
                  Sandbox Mode
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={env}
                onChange={(event) => setEnv(event.target.value)}
                className={cn(
                  "hidden h-9 rounded-md border-none px-3 text-sm font-medium outline-none transition-colors sm:block",
                  env === "sandbox" ? "bg-orange-100 text-orange-800" : "bg-secondary text-foreground"
                )}
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </select>
              <Button variant="ghost" className="relative h-9 w-9 p-0 text-muted-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
              </Button>
              <a href={getLogoutUrl(redirectUri)} className="hidden sm:block">
                <Button variant="ghost" className="h-9 w-9 p-0 text-muted-foreground" title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </a>
              <div className="flex items-center gap-2 border-l pl-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {initials}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">{session?.name || "Dashboard User"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session?.isSuperAdmin ? "Super-admin" : "Tenant member"}
                  </p>
                </div>
              </div>
            </div>
          </header>
          {env === "sandbox" ? (
            <div className="bg-orange-600 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white">
              Attention: You are performing operations in the Sandbox Environment
            </div>
          ) : null}
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8 lg:py-12">
            {banner ? (
              <div
                className={cn(
                  "mb-6 rounded-lg border px-4 py-3 text-sm",
                  banner.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                )}
              >
                {banner.message}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
