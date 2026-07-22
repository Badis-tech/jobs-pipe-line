import { JOB_TYPES, SOURCES } from "@/lib/jobs";
import { sourceLabel } from "@/lib/format";

interface FiltersProps {
  q?: string;
  source?: string;
  type?: string;
}

// Plain GET form: filters live in the URL, so pages are shareable and the
// component needs no client-side state.
export function Filters({ q, source, type }: FiltersProps) {
  const selectClasses =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <form method="get" action="/" className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search title or company…"
        className="min-w-56 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select name="source" defaultValue={source ?? ""} className={selectClasses}>
        <option value="">All sources</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {sourceLabel(s)}
          </option>
        ))}
      </select>
      <select name="type" defaultValue={type ?? ""} className={selectClasses}>
        <option value="">All types</option>
        {JOB_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
      >
        Filter
      </button>
    </form>
  );
}
