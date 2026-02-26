import { AdminGlobalNav } from "@/components/ui/AdminGlobalNav";

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminGlobalNav />
      <main className="admin-page-shell min-h-dvh bg-bg">{children}</main>
    </>
  );
}
