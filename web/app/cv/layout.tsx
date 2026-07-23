import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { CvSidebar } from "@/components/cv-sidebar";

// Shared layout for the internal Bewerbungs-Werkzeug. Admin-gated once here,
// so every /cv/* route is protected. Renders the sidebar nav.
export default async function CvLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
      <CvSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
