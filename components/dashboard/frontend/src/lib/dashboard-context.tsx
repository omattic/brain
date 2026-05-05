import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLoginUrl, getSession, getTenants } from "@/lib/api";
import type { DashboardSession, Tenant, TenantAccess } from "@/lib/types";

type BannerState = {
  kind: "success" | "error";
  message: string;
} | null;

type DashboardContextValue = {
  session: DashboardSession | null;
  tenants: Tenant[];
  tenantAccess: TenantAccess[];
  selectedTenantId: string | null;
  selectedTenant: Tenant | null;
  loading: boolean;
  banner: BannerState;
  canWriteSelectedTenant: boolean;
  selectTenant: (tenantId: string | null) => void;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  refreshWorkspace: () => Promise<void>;
};

const SELECTED_TENANT_KEY = "brain-dashboard:selected-tenant-id";
const DashboardContext = createContext<DashboardContextValue | null>(null);

function getStoredTenantId() {
  try {
    return window.localStorage.getItem(SELECTED_TENANT_KEY);
  } catch {
    return null;
  }
}

function storeTenantId(tenantId: string | null) {
  try {
    if (tenantId) {
      window.localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
    } else {
      window.localStorage.removeItem(SELECTED_TENANT_KEY);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantAccess, setTenantAccess] = useState<TenantAccess[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => getStoredTenantId());
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState>(null);

  const redirectUri = useMemo(() => window.location.href, []);

  const setSuccess = useCallback((message: string | null) => {
    setBanner(message ? { kind: "success", message } : null);
  }, []);

  const setError = useCallback((message: string | null) => {
    setBanner(message ? { kind: "error", message } : null);
  }, []);

  const selectTenant = useCallback((tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    storeTenantId(tenantId);
  }, []);

  const requireSession = useCallback(async () => {
    const { response, payload } = await getSession();
    if (response.ok && payload?.authenticated && payload.user) {
      const nextSession = {
        ...payload.user,
        isSuperAdmin: Boolean(payload.isSuperAdmin),
        tenantIds: payload.tenantIds || [],
      };
      setSession(nextSession);
      setTenantAccess(payload.tenantAccess || []);
      return nextSession;
    }

    window.location.replace(getLoginUrl(redirectUri));
    return null;
  }, [redirectUri]);

  const refreshWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const activeSession = await requireSession();
      if (!activeSession) {
        return;
      }

      const { response, payload } = await getTenants();
      if (!response.ok) {
        throw new Error((payload as any)?.error || "Unable to load tenants");
      }

      const nextTenants = payload?.tenants || [];
      setTenants(nextTenants);
      setSelectedTenantId((currentTenantId) => {
        const storedTenantId = currentTenantId || getStoredTenantId();
        const storedTenantStillVisible = nextTenants.some((tenant) => tenant.id === storedTenantId);
        const nextTenantId = storedTenantStillVisible
          ? storedTenantId
          : nextTenants.length === 1
            ? nextTenants[0].id
            : null;

        storeTenantId(nextTenantId);
        return nextTenantId;
      });
    } catch (caughtError) {
      setBanner({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      });
    } finally {
      setLoading(false);
    }
  }, [requireSession]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) || null,
    [selectedTenantId, tenants]
  );

  const canWriteSelectedTenant = useMemo(() => {
    if (session?.isSuperAdmin) return Boolean(selectedTenant);
    const access = tenantAccess.find((entry) => entry.tenantId === selectedTenantId);
    return Boolean(access?.canWrite);
  }, [selectedTenant, selectedTenantId, session, tenantAccess]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      session,
      tenants,
      tenantAccess,
      selectedTenantId,
      selectedTenant,
      loading,
      banner,
      canWriteSelectedTenant,
      selectTenant,
      setSuccess,
      setError,
      refreshWorkspace,
    }),
    [
      session,
      tenants,
      tenantAccess,
      selectedTenantId,
      selectedTenant,
      loading,
      banner,
      canWriteSelectedTenant,
      selectTenant,
      setSuccess,
      setError,
      refreshWorkspace,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
}
