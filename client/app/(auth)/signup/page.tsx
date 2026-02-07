"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ accessToken: string | null; needsEmailVerification?: boolean }>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ email, password })
        }
      );

      if (data.needsEmailVerification) {
        setMessage("Check your email to verify your account.");
        return;
      }

      if (data.accessToken) {
        setAccessToken(data.accessToken);
        router.push("/dashboard");
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Signup failed";

      // If user was already created (e.g. cold-start timeout), auto-login
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")) {
        try {
          const loginData = await apiFetch<{ accessToken: string }>(
            "/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) }
          );
          setAccessToken(loginData.accessToken);
          router.push("/dashboard");
          return;
        } catch {
          setError("Account exists. Try signing in instead.");
          return;
        }
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Create your studio</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Start building a new visual language.
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
            placeholder="At least 8 characters"
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
        {message && (
          <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500 ring-1 ring-emerald-500/20">
            {message}
          </div>
        )}
        <button className="button button-primary w-full py-2.5" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <div className="mt-6 text-sm text-center">
        <span className="text-[var(--text-secondary)]">Already have an account? </span>
        <Link href="/login" className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-light)]">
          Sign in
        </Link>
      </div>
    </div>
  );
}
