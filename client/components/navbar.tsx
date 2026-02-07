"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { clearAccessToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  LogOut,
  User,
  Code2,
  X,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Menu,
  LayoutDashboard,
  Wand2,
  Palette
} from "lucide-react";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showDevModal, setShowDevModal] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch dev mode status on mount
  const fetchDevStatus = useCallback(async () => {
    try {
      const data = await apiFetch<{
        profile: { isDevMode: boolean };
      }>("/profile");
      setIsDevMode(data.profile.isDevMode);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchDevStatus();
  }, [fetchDevStatus]);

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
  };

  const handleToggleDevMode = async () => {
    setDevError(null);
    if (isDevMode) {
      setDevLoading(true);
      try {
        await apiFetch("/profile/dev-mode", {
          method: "POST",
          body: JSON.stringify({ passkey: "deactivate", activate: false })
        });
        setIsDevMode(false);
        setShowDevModal(false);
      } catch (err) {
        setDevError(
          (err as { message?: string })?.message ?? "Failed to deactivate"
        );
      } finally {
        setDevLoading(false);
      }
      return;
    }

    if (!passkey.trim()) {
      setDevError("Passkey is required.");
      return;
    }
    setDevLoading(true);
    try {
      const res = await apiFetch<{ isDevMode: boolean }>(
        "/profile/dev-mode",
        {
          method: "POST",
          body: JSON.stringify({ passkey: passkey.trim(), activate: true })
        }
      );
      setIsDevMode(res.isDevMode);
      setPasskey("");
      setShowDevModal(false);
    } catch (err) {
      setDevError(
        (err as { message?: string })?.message ?? "Invalid passkey"
      );
    } finally {
      setDevLoading(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Logo + Dev badge */}
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="brand-logo text-xl sm:text-2xl">
              ArtMorph
            </Link>
            {isDevMode && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 sm:text-[10px] sm:px-2">
                Dev
              </span>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link
              href="/dashboard"
              className={`button button-ghost ${isActive("/dashboard") ? "bg-[var(--bg-secondary)]" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`button button-ghost ${isActive("/create") ? "bg-[var(--bg-secondary)]" : ""}`}
            >
              Create
            </Link>
            <Link
              href="/styles"
              className={`button button-ghost ${isActive("/styles") ? "bg-[var(--bg-secondary)]" : ""}`}
            >
              Styles
            </Link>
            <div className="mx-1 h-5 w-px bg-[var(--border)]" />
            <button
              onClick={() => {
                setDevError(null);
                setPasskey("");
                setShowDevModal(true);
              }}
              className={`button button-ghost ${isDevMode ? "text-amber-600 dark:text-amber-400" : ""}`}
              title={isDevMode ? "Developer Mode Active" : "Developer Mode"}
            >
              <Code2 size={15} />
            </button>
            <Link href="/profile" className="button button-ghost">
              <User size={15} />
            </Link>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="button button-ghost"
              type="button"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </nav>

          {/* Mobile: icon row + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="button button-ghost p-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-[var(--bg-secondary)] text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                href="/create"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/create")
                    ? "bg-[var(--bg-secondary)] text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <Wand2 size={16} /> Create
              </Link>
              <Link
                href="/styles"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/styles")
                    ? "bg-[var(--bg-secondary)] text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <Palette size={16} /> Styles
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/profile")
                    ? "bg-[var(--bg-secondary)] text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <User size={16} /> Profile
              </Link>
              <div className="my-1 h-px bg-[var(--border)]" />
              <button
                onClick={() => {
                  setDevError(null);
                  setPasskey("");
                  setShowDevModal(true);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  isDevMode
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <Code2 size={16} />
                {isDevMode ? "Dev Mode Active" : "Developer Mode"}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Dev Mode Modal */}
      {showDevModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowDevModal(false)}
        >
          <div
            className="card w-full max-w-sm p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDevMode ? (
                  <ShieldCheck size={20} className="text-amber-500" />
                ) : (
                  <Code2 size={20} className="text-[var(--text-secondary)]" />
                )}
                <h3 className="text-base font-semibold">Developer Mode</h3>
              </div>
              <button
                onClick={() => setShowDevModal(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg)]"
              >
                <X size={16} />
              </button>
            </div>

            {isDevMode ? (
              <div className="mt-4">
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <ShieldCheck size={16} />
                    Developer Mode is Active
                  </div>
                  <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/70">
                    You have unlimited generations. Deactivate to return to the
                    free tier.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleToggleDevMode}
                    disabled={devLoading}
                    className="button button-danger flex-1"
                  >
                    {devLoading ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <ShieldOff size={14} className="mr-1.5" />
                    )}
                    Deactivate
                  </button>
                  <button
                    onClick={() => setShowDevModal(false)}
                    className="button button-ghost"
                  >
                    Close
                  </button>
                </div>
                {devError && (
                  <p className="mt-2 text-xs text-red-500">{devError}</p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Enter the developer passkey to unlock unlimited generations.
                </p>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleToggleDevMode();
                  }}
                  className="input mt-3 w-full"
                  placeholder="Passkey"
                  autoFocus
                />
                {devError && (
                  <p className="mt-2 text-xs text-red-500">{devError}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleToggleDevMode}
                    disabled={devLoading}
                    className="button button-primary flex-1"
                  >
                    {devLoading ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <ShieldCheck size={14} className="mr-1.5" />
                    )}
                    Activate
                  </button>
                  <button
                    onClick={() => setShowDevModal(false)}
                    className="button button-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
