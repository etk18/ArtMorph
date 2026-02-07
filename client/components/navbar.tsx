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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const navLinkClass = (path: string) =>
    `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? "text-[var(--accent)] bg-[var(--accent-surface)]"
        : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--accent-surface)]"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Left: Logo + Dev badge */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="brand-logo text-xl">
              ArtMorph
            </Link>
            {isDevMode && (
              <span className="rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500 ring-1 ring-amber-500/20 sm:text-[10px]">
                Dev
              </span>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              <span className="flex items-center gap-1.5">
                <LayoutDashboard size={14} />
                Dashboard
              </span>
            </Link>
            <Link href="/create" className={navLinkClass("/create")}>
              <span className="flex items-center gap-1.5">
                <Wand2 size={14} />
                Create
              </span>
            </Link>
            <Link href="/styles" className={navLinkClass("/styles")}>
              <span className="flex items-center gap-1.5">
                <Palette size={14} />
                Styles
              </span>
            </Link>

            <div className="mx-2 h-5 w-px bg-[var(--border)]" />

            <button
              onClick={() => {
                setDevError(null);
                setPasskey("");
                setShowDevModal(true);
              }}
              className={`rounded-lg p-2 transition-all ${
                isDevMode
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-surface)]"
              }`}
              title={isDevMode ? "Developer Mode Active" : "Developer Mode"}
            >
              <Code2 size={16} />
            </button>
            <Link
              href="/profile"
              className="rounded-lg p-2 text-[var(--text-tertiary)] transition-all hover:text-[var(--text-secondary)] hover:bg-[var(--accent-surface)]"
            >
              <User size={16} />
            </Link>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-[var(--text-tertiary)] transition-all hover:text-red-500 hover:bg-red-500/10"
              type="button"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </nav>

          {/* Mobile: icon row + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--accent-surface)]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-[var(--glass-border)] bg-[var(--glass)] px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-[var(--accent-surface)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-surface)] hover:text-[var(--text)]"
                }`}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                href="/create"
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/create")
                    ? "bg-[var(--accent-surface)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-surface)] hover:text-[var(--text)]"
                }`}
              >
                <Wand2 size={16} /> Create
              </Link>
              <Link
                href="/styles"
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/styles")
                    ? "bg-[var(--accent-surface)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-surface)] hover:text-[var(--text)]"
                }`}
              >
                <Palette size={16} /> Styles
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/profile")
                    ? "bg-[var(--accent-surface)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-surface)] hover:text-[var(--text)]"
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
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  isDevMode
                    ? "text-amber-500"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-surface)] hover:text-[var(--text)]"
                }`}
              >
                <Code2 size={16} />
                {isDevMode ? "Dev Mode Active" : "Developer Mode"}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => setShowDevModal(false)}
        >
          <div
            className="card w-full max-w-sm p-6 shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isDevMode ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <ShieldCheck size={16} className="text-amber-500" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-surface)]">
                    <Code2 size={16} className="text-[var(--accent)]" />
                  </div>
                )}
                <h3 className="text-base font-semibold">Developer Mode</h3>
              </div>
              <button
                onClick={() => setShowDevModal(false)}
                className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]"
              >
                <X size={16} />
              </button>
            </div>

            {isDevMode ? (
              <div className="mt-5">
                <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 ring-1 ring-amber-500/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                    <ShieldCheck size={15} />
                    Developer Mode is Active
                  </div>
                  <p className="mt-1.5 text-xs text-amber-500/70">
                    You have unlimited generations. Deactivate to return to the
                    free tier.
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
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
              <div className="mt-5">
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
                <div className="mt-5 flex gap-2">
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
