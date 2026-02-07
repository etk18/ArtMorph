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
    <div className="card p-5 sm:p-8">
      <h2 className="section-title">Set a new password</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Choose a strong password to secure your ArtMorph account.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Reset token"
          type="text"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          required
        />
        <input
          className="input"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <div className="mt-6 text-sm">
        <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text)] underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
