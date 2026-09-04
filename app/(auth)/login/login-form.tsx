"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password combination isn't recognised."
          : signInError.message,
      );
      setPending(false);
      return;
    }

    // refresh() re-runs the server components with the new session cookie
    // before we navigate, so the dashboard renders signed-in on first paint.
    router.refresh();
    router.replace(nextPath);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-dim">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-faint/60 focus:border-brand/60"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-medium text-ink-dim"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-ink-faint/60 focus:border-brand/60"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-st-error/10 px-3 py-2 text-sm text-st-error ring-1 ring-st-error/25"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <DemoHint onPick={(e, p) => { setEmail(e); setPassword(p); }} />
    </form>
  );
}

/** Prototype convenience: one tap fills a demo account during the walkthrough. */
function DemoHint({ onPick }: { onPick: (email: string, password: string) => void }) {
  const accounts = [
    { role: "Admin", email: "admin@demo.sg", password: "PrinterFloor#2026" },
    { role: "Operator", email: "operator@demo.sg", password: "PrinterFloor#2026" },
    { role: "Viewer", email: "viewer@demo.sg", password: "PrinterFloor#2026" },
  ];

  return (
    <div className="border-t border-line-soft pt-4">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-ink-faint">
        Prototype accounts
      </p>
      <div className="flex flex-wrap gap-1.5">
        {accounts.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => onPick(a.email, a.password)}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs text-ink-dim transition hover:border-brand/40 hover:text-ink"
          >
            {a.role}
          </button>
        ))}
      </div>
    </div>
  );
}
