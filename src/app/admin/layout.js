import { AdminGlobalNav } from "@/components/ui/AdminGlobalNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyStaffToken } from "@/lib/security/jwt";

export default async function AdminLayout({ children }) {
  const token = (await cookies()).get("staff_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    await verifyStaffToken(token);
  } catch {
    redirect("/admin/login");
  }
  return (
    <>
      <AdminGlobalNav />
      <main className="admin-page-shell min-h-dvh bg-bg">{children}</main>
    </>
  );
}
