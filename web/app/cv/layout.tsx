import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { CvSidebar } from "@/components/cv-sidebar";

// Shared layout for the internal Bewerbungs-Werkzeug. Admin-gated: every /cv/*
// route requires a logged-in admin (so saved docs attribute to a real user).
export default async function CvLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    redirect("/login?next=/cv");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
      <CvSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
