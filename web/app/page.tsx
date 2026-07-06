import { fetchJobs } from "@/lib/jobs";
import { Filters } from "@/components/filters";
import { JobCard } from "@/components/job-card";
import { Pagination } from "@/components/pagination";

interface SearchParams {
  q?: string;
  source?: string;
  type?: string;
  page?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, source, type, page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const { jobs, total, pageCount } = await fetchJobs({ q, source, type, page });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Jobs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total.toLocaleString("en-GB")} postings from Remotive, Arbeitnow, Jobicy, The
          Muse and the Bundesagentur für Arbeit, refreshed every 6 hours.
        </p>
      </header>

      <Filters q={q} source={source} type={type} />

      {jobs.length === 0 ? (
        <p className="mt-10 text-center text-zinc-500">No jobs match these filters.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Pagination page={page} pageCount={pageCount} params={{ q, source, type }} />
      </div>
    </main>
  );
}
