import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-60">
        <AdminTopbar userName={session.user.name ?? session.user.email ?? "Admin"} />
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
