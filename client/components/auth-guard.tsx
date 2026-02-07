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
      <div className="flex h-screen items-center justify-center text-sm text-zinc-400">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
};
