"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage("Password reset email sent.");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Reset password</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        We will send a secure reset link to your email.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
          <input
            className="input"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500 ring-1 ring-red-500/20">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500 ring-1 ring-emerald-500/20">
            {message}
          </div>
        )}
        <button className="button button-primary w-full py-2.5" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className="mt-6 text-sm text-center">
        <Link href="/login" className="text-[var(--text-secondary)] transition hover:text-[var(--accent)]">
          Back to login
        </Link>
      </div>
    </div>
  );
}
