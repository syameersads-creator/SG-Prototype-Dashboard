import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in · Printer Floor" };

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-5 py-10">
      {/* Faint grid, so the sign-in screen reads as part of the product. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--color-line-soft) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 ring-1 ring-brand/30">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-brand"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 7 12 3l8 4v10l-8 4-8-4z" />
              <path d="M4 7l8 4 8-4M12 11v10" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Printer Floor</h1>
          <p className="mt-1.5 text-sm text-ink-faint">
            Production lot &amp; progress monitoring
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <Suspense
            fallback={<div className="h-64 animate-pulse rounded-xl bg-surface-2" />}
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
