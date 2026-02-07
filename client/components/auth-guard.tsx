"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, clearAccessToken } from "@/lib/auth";

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    // Add 30-second buffer before expiry
    return Date.now() >= (payload.exp * 1000) - 30_000;
  } catch {
    return true; // Malformed token = expired
  }
};

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      clearAccessToken();
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <span className="text-xs text-[var(--text-tertiary)]">Checking session...</span>
      </div>
    );
  }

  return <>{children}</>;
};
