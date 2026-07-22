import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Enter your email and we&apos;ll send you a magic link — no password.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to jobs
        </Link>
      </p>
    </main>
  );
}
