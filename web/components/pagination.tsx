import Link from "next/link";

interface PaginationProps {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
}

function pageHref(params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/?${qs}` : "/";
}

export function Pagination({ page, pageCount, params }: PaginationProps) {
  if (pageCount <= 1) return null;
  const linkClasses =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <nav className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={pageHref(params, page - 1)} className={linkClasses}>
          ← Previous
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm text-zinc-400">← Previous</span>
      )}
      <span className="text-sm text-zinc-500">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={pageHref(params, page + 1)} className={linkClasses}>
          Next →
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm text-zinc-400">Next →</span>
      )}
    </nav>
  );
}
