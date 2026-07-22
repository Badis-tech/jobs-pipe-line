import Link from "next/link";

// €500 full-service offer. Option (b): direct contact via WhatsApp + email.
// Replace the placeholders below with your real details (see the two consts).
const WHATSAPP_NUMBER = "21600000000"; // TODO: your number, digits only, incl. country code (216 = Tunisia)
const CONTACT_EMAIL = "you@example.com"; // TODO: your email

const waMessage = encodeURIComponent(
  "Hi! I'm interested in the €500 full Ausbildung service (CV, cover letter, documents & application help).",
);
const mailSubject = encodeURIComponent("Full Ausbildung Service (€500)");
const mailBody = encodeURIComponent(
  "Hi,\n\nI'd like the full service — CV, cover letter, and Ausbildung application documents.\n\nMy name:\nField/Ausbildung I want:\nCurrent situation:\n\nThanks!",
);

export default function FullServicePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
        ← Back to jobs
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Full Ausbildung Service
      </h1>
      <p className="mt-2 text-4xl font-extrabold text-amber-600 dark:text-amber-400">€500</p>
      <p className="mt-1 text-sm text-zinc-500">One-time. We handle everything.</p>

      <ul className="mt-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        <li>✅ Professional German CV (Lebenslauf) tailored to Ausbildung</li>
        <li>✅ Cover letter (Anschreiben) for your target field</li>
        <li>✅ All required application documents prepared</li>
        <li>✅ Help finding and applying to the right Ausbildung positions</li>
        <li>✅ Direct guidance until you&apos;ve applied</li>
      </ul>

      <div className="mt-8 space-y-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
        >
          💬 Contact on WhatsApp
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          ✉️ Email us
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        We&apos;ll reply personally and get you started.
      </p>
    </main>
  );
}
