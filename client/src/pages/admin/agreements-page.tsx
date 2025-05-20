import { AgreementManager } from "@/components/admin/agreement-manager";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function AgreementManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Seller Agreement Management</h1>
          <p className="text-muted-foreground">Manage seller agreements and versions.</p>
        </div>
        <AgreementManager />
      </div>
    </AdminLayout>
  );
}