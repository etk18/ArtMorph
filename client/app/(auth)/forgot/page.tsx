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
    <div className="card p-5 sm:p-8">
      <h2 className="section-title">Reset password</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        We will send a secure reset link to your email.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className="mt-6 text-sm">
        <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text)] underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </div>
  );
}
