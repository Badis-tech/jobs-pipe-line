import { CvGenerator } from "@/components/cv-generator";

// Internal tool: German CV + cover letter generator (from form).
// Admin gate + sidebar live in the shared layout (app/cv/layout.tsx).
// The heading + EN/DE language toggle live inside CvGenerator so the toggle can
// switch the whole tool's UI language.
export default function CvPage() {
  return <CvGenerator />;
}
