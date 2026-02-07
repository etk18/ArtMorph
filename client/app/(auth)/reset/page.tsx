"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const extractTokenFromHash = () => {
  if (typeof window === "undefined") {
    return "";
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return "";
  }
  const params = new URLSearchParams(hash);
  return params.get("access_token") ?? params.get("token") ?? "";
};

import { Suspense } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenFromQuery =
      searchParams.get("access_token") || searchParams.get("token") || "";
    const tokenFromHash = extractTokenFromHash();
    const token = tokenFromQuery || tokenFromHash;
    if (token) {
      setAccessToken(token);
    }
  }, [searchParams]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!accessToken) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ accessToken, newPassword: password })
      });
      setMessage("Password updated. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Reset failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Set a new password</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Choose a strong password to secure your ArtMorph account.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Reset Token</label>
          <input
            className="input"
            placeholder="Paste reset token"
            type="text"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">New Password</label>
          <input
            className="input"
            placeholder="At least 8 characters"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Confirm Password</label>
          <input
            className="input"
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <div className="mt-6 text-sm text-center">
        <Link href="/login" className="text-[var(--text-secondary)] transition hover:text-[var(--accent)]">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-sm text-[var(--text-secondary)]">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
