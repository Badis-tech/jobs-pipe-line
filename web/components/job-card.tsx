import Link from "next/link";
import type { JobListItem } from "@/lib/jobs";
import { formatDate, sourceLabel, typeLabel } from "@/lib/format";

export function JobCard({ job }: { job: JobListItem }) {
  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{job.title}</h2>
          <span className="shrink-0 text-xs text-zinc-500">{formatDate(job.published_at)}</span>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <Badge>{sourceLabel(job.source)}</Badge>
          {job.job_type && <Badge>{typeLabel(job.job_type)}</Badge>}
          {job.remote && <Badge>Remote</Badge>}
          {job.salary_text && <Badge>{job.salary_text}</Badge>}
          {job.category && <span className="text-zinc-500">{job.category}</span>}
        </div>
      </Link>
    </li>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}
