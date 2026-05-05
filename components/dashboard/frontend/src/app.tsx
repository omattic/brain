import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";
import { IgHashtagsPage } from "@/pages/ig-hashtags-page";
import { SettingsPage } from "@/pages/settings-page";
import { TenantPickerPage } from "@/pages/tenant-picker-page";
import { Card } from "@/components/ui/card";

function HomeRoute() {
  const { loading, selectedTenant, tenants } = useDashboard();

  if (loading) {
    return <Card className="text-sm text-muted-foreground">Loading dashboard...</Card>;
  }

  if (selectedTenant || tenants.length === 1) {
    return <Navigate to="/ig-hashtags" replace />;
  }

  return <TenantPickerPage />;
}

export function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/ig-hashtags" element={<IgHashtagsPage />} />
            <Route path="/tenants" element={<TenantPickerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      </DashboardProvider>
    </BrowserRouter>
  );
}
