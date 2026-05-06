import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";
import { IgHashtagsPage } from "@/pages/ig-hashtags-page";
import { SettingsPage } from "@/pages/settings-page";
import { TenantPickerPage } from "@/pages/tenant-picker-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/lib/api";

function HomeRoute() {
  const { selectedTenant, tenants } = useDashboard();

  if (selectedTenant || tenants.length === 1) {
    return <Navigate to="/ig-hashtags" replace />;
  }

  return <TenantPickerPage />;
}

function DashboardBootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <LoaderCircle className="h-6 w-6 animate-spin text-brand" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">Checking dashboard access</div>
          <p className="mt-1 text-sm text-muted-foreground">Verifying your session before loading Brain.</p>
        </div>
      </Card>
    </div>
  );
}

function DashboardAccessDenied() {
  const { banner } = useDashboard();
  const redirectUri = window.location.href;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
          <ShieldAlert className="h-6 w-6 text-rose-600" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight text-foreground">No dashboard access</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {banner?.message || "Your account does not have an active Brain tenant session."}
          </p>
        </div>
        <a href={getLoginUrl(redirectUri)}>
          <Button variant="outline">Try another account</Button>
        </a>
      </Card>
    </div>
  );
}

function DashboardRoutes() {
  const { loading, session } = useDashboard();

  if (loading) {
    return <DashboardBootScreen />;
  }

  if (!session) {
    return <DashboardAccessDenied />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/ig-hashtags" element={<IgHashtagsPage />} />
        <Route path="/tenants" element={<TenantPickerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <DashboardRoutes />
      </DashboardProvider>
    </BrowserRouter>
  );
}
