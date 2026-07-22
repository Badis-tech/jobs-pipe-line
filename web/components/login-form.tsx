"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createSupabaseBrowser();

    // Only allow safe internal paths (must start with a single "/") to avoid
    // open-redirect abuse. Anything else falls back to home.
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      safeNext,
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callback,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">Check your inbox</p>
        <p className="mt-1 text-zinc-500">
          We sent a magic link to <span className="font-medium">{email}</span>. Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
