"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setAccessToken(data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Sign in to access your studio.
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Password</label>
          <input
            className="input"
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500 ring-1 ring-red-500/20">
            {error}
          </div>
        )}
        <button className="button button-primary w-full py-2.5" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot" className="text-[var(--text-secondary)] transition hover:text-[var(--accent)]">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-light)]">
          Create account
        </Link>
      </div>
    </div>
  );
}
