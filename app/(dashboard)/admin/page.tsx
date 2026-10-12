import { requireRole } from "@/lib/auth";
import { getAdminTenantsWithUsers } from "@/server/actions/admin";
import { AdminDashboard } from "@/components/modules/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const { tenants } = await getAdminTenantsWithUsers();

  return <AdminDashboard currentUserId={user.userId} tenants={tenants} />;
}
