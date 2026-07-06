import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { fetchJob } from "@/lib/jobs";
import { formatDate, sourceLabel, typeLabel } from "@/lib/format";

// description_html comes from external job APIs and is untrusted.
function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: { a: ["href"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "nofollow noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) notFound();
  const job = await fetchJob(jobId);
  if (!job) notFound();

  const description = job.description_html ? sanitizeDescription(job.description_html) : "";
  // Jobsuche descriptions are plain text with newlines, not HTML.
  const isPlainText = description !== "" && !description.includes("<");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← All jobs
      </Link>

      <header className="mt-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{job.title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500">
          <Meta label="Source" value={sourceLabel(job.source)} />
          <Meta label="Type" value={typeLabel(job.job_type)} />
          <Meta label="Category" value={job.category} />
          <Meta label="Salary" value={job.salary_text} />
          <Meta label="Published" value={formatDate(job.published_at)} />
          {job.remote && <Meta label="Remote" value="Yes" />}
        </dl>
        <a
          href={job.url}
          rel="nofollow noopener noreferrer"
          target="_blank"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          View original posting ↗
        </a>
      </header>

      {description === "" ? (
        <p className="mt-6 text-sm text-zinc-500">
          No description available — see the original posting.
        </p>
      ) : isPlainText ? (
        <p className="job-description mt-6 whitespace-pre-line">{description}</p>
      ) : (
        <div
          className="job-description mt-6"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {job.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-1.5">
      <dt className="font-medium text-zinc-700 dark:text-zinc-300">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
