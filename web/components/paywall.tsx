import Link from "next/link";

interface PaywallProps {
  // Whether a user is logged in. Drives "sign in" vs "subscribe" CTA.
  loggedIn: boolean;
  // Page the user tried to reach, so we can send them back after paying/login.
  attemptedPage: number;
}

// Shown server-side when a non-subscriber requests a locked page (3+). The
// locked job data is never fetched or sent to the browser — this replaces it.
export function Paywall({ loggedIn, attemptedPage }: PaywallProps) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-6 text-center dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          🔒
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          You&apos;ve reached the free limit
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          The first 20 Ausbildung listings are free. Unlock unlimited access to
          every listing for just €4.99/month — cancel anytime.
        </p>

        {loggedIn ? (
          <Link
            href={`/checkout?next=${attemptedPage}`}
            className="mt-4 inline-block rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Unlock unlimited — €4.99/mo
          </Link>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/?page=${attemptedPage}`)}`}
            className="mt-4 inline-block rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in to unlock — €4.99/mo
          </Link>
        )}
        <p className="mt-3 text-xs text-zinc-400">
          Secure payment via Lemon Squeezy. VAT handled for you.
        </p>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
        <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
          Want us to do it all for you?
        </h3>
        <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
          Full service — we build your German CV, cover letter and all required
          Ausbildung application documents, and help you apply. One-time €500.
        </p>
        <Link
          href="/full-service"
          className="mt-3 inline-block rounded-md border border-amber-500 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-950/50"
        >
          Get the full service — €500
        </Link>
      </div>
    </div>
  );
}
