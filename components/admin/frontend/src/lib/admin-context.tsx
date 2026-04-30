import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFailedEvents, getLoginUrl, getSession, getTenants } from "@/lib/api";
import type { AdminSession, MetaWebhookEvent, Tenant } from "@/lib/types";

type BannerState = {
  kind: "success" | "error";
  message: string;
} | null;

type AdminContextValue = {
  session: AdminSession | null;
  tenants: Tenant[];
  failedEvents: MetaWebhookEvent[];
  loading: boolean;
  banner: BannerState;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  refreshWorkspace: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [failedEvents, setFailedEvents] = useState<MetaWebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState>(null);

  const redirectUri = useMemo(() => window.location.href, []);

  const setSuccess = useCallback((message: string | null) => {
    setBanner(message ? { kind: "success", message } : null);
  }, []);

  const setError = useCallback((message: string | null) => {
    setBanner(message ? { kind: "error", message } : null);
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

      const [{ payload: tenantsPayload }, { payload: eventsPayload }] = await Promise.all([
        getTenants(),
        getFailedEvents({ limit: 25 }),
      ]);

      setTenants(tenantsPayload?.tenants || []);
      setFailedEvents(eventsPayload?.events || []);
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

  const value = useMemo<AdminContextValue>(
    () => ({
      session,
      tenants,
      failedEvents,
      loading,
      banner,
      setSuccess,
      setError,
      refreshWorkspace,
    }),
    [session, tenants, failedEvents, loading, banner, setSuccess, setError, refreshWorkspace]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }

  return context;
}
