import { requireAuthenticatedUser } from "@/lib/auth";
import { DashboardSidebar } from "@/components/modules/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar user={{ fullName: user.fullName, role: user.role }} />
      <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="mx-auto w-full max-w-6xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

