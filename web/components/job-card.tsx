import Link from "next/link";
import type { JobListItem } from "@/lib/jobs";
import { formatDate, formatLocation, formatSalary, sourceLabel, typeLabel } from "@/lib/format";

export function JobCard({ job }: { job: JobListItem }) {
  const location = formatLocation(job.location);
  const salary = formatSalary(job.salary_text);
  const meta = [job.company, location].filter(Boolean).join(" · ");

  return (
    <li className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand/40">
      {/* Red accent bar that grows on hover */}
      <span className="absolute inset-y-0 left-0 w-0.5 bg-brand opacity-0 transition-opacity group-hover:opacity-100" />
      <Link href={`/jobs/${job.id}`} className="block p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold leading-snug text-zinc-900 group-hover:text-brand dark:text-zinc-100">
            {job.title}
          </h2>
          <span className="shrink-0 text-xs text-zinc-400">{formatDate(job.published_at)}</span>
        </div>
        {meta && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{meta}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {job.job_type && <Badge variant="brand">{typeLabel(job.job_type)}</Badge>}
          {salary && <Badge variant="gold">{salary}</Badge>}
          {job.remote && <Badge>Remote</Badge>}
          <Badge variant="muted">{sourceLabel(job.source)}</Badge>
        </div>
      </Link>
    </li>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "brand" | "gold" | "muted";
}) {
  const styles = {
    default:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    brand:
      "bg-brand/10 text-brand font-medium dark:bg-brand/15",
    gold:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    muted:
      "text-zinc-400 dark:text-zinc-500",
  }[variant];
  return <span className={`rounded-full px-2 py-0.5 ${styles}`}>{children}</span>;
}
