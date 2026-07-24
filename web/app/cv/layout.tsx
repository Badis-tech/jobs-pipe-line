import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { CvTabs } from "@/components/cv-tabs";

// Shared layout for the internal Bewerbungs-Werkzeug. Admin-gated: every /cv/*
// route requires a logged-in admin (so saved docs attribute to a real user).
// The tool sub-nav is a top tab bar; the tools own the full width below it.
export default async function CvLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    redirect("/login?next=/cv");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <CvTabs />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
