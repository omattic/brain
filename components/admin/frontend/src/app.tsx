import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/admin-layout";
import { AdminProvider } from "@/lib/admin-context";
import { MonitoringPage } from "@/pages/monitoring-page";
import { OverviewPage } from "@/pages/overview-page";
import { TenantDetailsPage } from "@/pages/tenant-details-page";
import { TenantsPage } from "@/pages/tenants-page";

export function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <AdminLayout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/:tenantId" element={<TenantDetailsPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminLayout>
      </AdminProvider>
    </BrowserRouter>
  );
}
