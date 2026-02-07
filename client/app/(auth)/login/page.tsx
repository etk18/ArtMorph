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
    <div className="card p-5 sm:p-8">
      <h2 className="section-title">Welcome back</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Sign in to access your studio.
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
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <p className="text-sm text-ember-500">{error}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot" className="text-aurora-600">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-aurora-600">
          Create account
        </Link>
      </div>
    </div>
  );
}
