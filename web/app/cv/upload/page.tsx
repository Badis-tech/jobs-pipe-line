import { CvReformat } from "@/components/cv-reformat";

// Internal tool: reformat an existing CV/cover letter into German documents.
// Admin gate + sidebar live in the shared layout (app/cv/layout.tsx).
// The heading + EN/DE language toggle live inside CvReformat so the toggle can
// switch the whole tool's UI language.
export default function CvUploadPage() {
  return <CvReformat />;
}
