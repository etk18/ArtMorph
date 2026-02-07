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
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sm:p-8">
      <h2 className="section-title">Create your studio</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Start building a new visual language.
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
        {message && <p className="text-sm text-aurora-600">{message}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <div className="mt-6 text-sm">
        <Link href="/login" className="text-aurora-600">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
