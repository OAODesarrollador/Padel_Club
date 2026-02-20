import { PublicGlobalNav } from "@/components/ui/PublicGlobalNav";
import { PublicGlobalFooter } from "@/components/ui/PublicGlobalFooter";

export default function PublicLayout({ children }) {
  return (
    <>
      <PublicGlobalNav />
      <main className="public-page-shell min-h-dvh bg-bg pb-24">
        {children}
        <PublicGlobalFooter />
      </main>
    </>
  );
}
