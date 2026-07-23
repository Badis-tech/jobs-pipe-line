import { CvSidebar } from "@/components/cv-sidebar";

// Shared layout for the Bewerbungs-Werkzeug. Renders the sidebar nav.
//
// NOTE: admin gate is TEMPORARILY DISABLED — all features are open for testing.
// To re-lock, restore the check below (and the API routes still enforce it if
// you re-enable there too):
//
//   import { redirect } from "next/navigation";
//   import { isAdmin } from "@/lib/admin";
//   if (!(await isAdmin())) redirect("/");
export default function CvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
      <CvSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
