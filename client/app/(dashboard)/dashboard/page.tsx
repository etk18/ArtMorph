"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  ExternalLink,
  X,
  Download,
  Plus,
  Upload,
  Palette,
  User,
  Filter,
  ArrowUpDown,
  Infinity,
  Zap
} from "lucide-react";

type Job = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  prompt: string | null;
  styleName: string | null;
  styleKey: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

type GenerationLimit = {
  limit: number;
  used: number;
  remaining: number;
  isDevMode: boolean;
  canGenerate: boolean;
};

type StatusFilter = "ALL" | "COMPLETED" | "PROCESSING" | "QUEUED" | "FAILED";
type SortMode = "newest" | "oldest";

const statusIcon = (status: Job["status"]) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle size={14} className="text-emerald-500" />;
    case "FAILED":
      return <XCircle size={14} className="text-red-500" />;
    case "PROCESSING":
      return <Loader2 size={14} className="animate-spin text-[var(--text-secondary)]" />;
    case "QUEUED":
      return <Clock size={14} className="text-amber-500" />;
  }
};

const statusLabel = (status: Job["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    case "PROCESSING":
      return "Processing";
    case "QUEUED":
      return "Queued";
  }
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Job | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [genLimit, setGenLimit] = useState<GenerationLimit | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiFetch<{ jobs: Job[] }>("/jobs");
      setJobs(data.jobs ?? []);
      setError(null);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Failed to load jobs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLimit = useCallback(async () => {
    try {
      const data = await apiFetch<GenerationLimit>("/profile/generation-limit");
      setGenLimit(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchLimit();
    intervalRef.current = setInterval(fetchJobs, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "QUEUED" || j.status === "PROCESSING"
    );
    if (!loading && !hasActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (hasActive && !intervalRef.current) {
      intervalRef.current = setInterval(fetchJobs, 5000);
    }
  }, [jobs, loading, fetchJobs]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this generation? This cannot be undone.")) return;
    setDeletingId(jobId);
    try {
      await apiFetch(`/jobs/${jobId}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (lightbox?.id === jobId) setLightbox(null);
    } catch (err) {
      alert((err as { message?: string })?.message ?? "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Derived data ── */
  const activeJobs = jobs.filter(
    (j) => j.status === "QUEUED" || j.status === "PROCESSING"
  ).length;
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
  const failedJobs = jobs.filter((j) => j.status === "FAILED").length;
  const completedWithOutput = jobs.filter(
    (j) => j.status === "COMPLETED" && j.outputUrl
  );

  /* ── Filter + Sort for activity list ── */
  const filteredJobs = jobs.filter((j) =>
    statusFilter === "ALL" ? true : j.status === statusFilter
  );
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortMode === "newest" ? dateB - dateA : dateA - dateB;
  });
  const displayJobs = sortedJobs.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <XCircle className="mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm font-medium">Could not load your projects</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{error}</p>
        <button onClick={fetchJobs} className="button button-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && lightbox.outputUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex gap-2">
              <a
                href={lightbox.outputUrl}
                download
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <Download size={14} />
                Download
              </a>
              <button
                onClick={() => handleDelete(lightbox.id)}
                disabled={deletingId === lightbox.id}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-red-500/40"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <X size={14} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.outputUrl}
              alt={lightbox.styleName ?? "Generated image"}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-white">
                {lightbox.styleName ?? "Generated Image"}
              </p>
              <p className="text-xs text-white/60">
                {formatDate(lightbox.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Page Header — branded feel */}
        <div className="card p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                Studio
              </p>
              <h1 className="page-heading mt-1.5 text-2xl sm:text-4xl">Dashboard</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Track your generations and manage your creative projects.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { fetchJobs(); fetchLimit(); }}
                className="button button-ghost"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
              <Link href="/create" className="button button-primary">
                <Zap size={15} className="mr-1.5" />
                <span className="hidden xs:inline">New Project</span>
                <span className="xs:hidden">New</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/create"
            className="action-card flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
              <Plus size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Create</p>
              <p className="text-xs text-[var(--text-tertiary)]">New generation</p>
            </div>
          </Link>
          <Link
            href="/upload"
            className="action-card flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10">
              <Upload size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upload</p>
              <p className="text-xs text-[var(--text-tertiary)]">Add an image</p>
            </div>
          </Link>
          <Link
            href="/styles"
            className="action-card flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10">
              <Palette size={18} className="text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Styles</p>
              <p className="text-xs text-[var(--text-tertiary)]">Browse styles</p>
            </div>
          </Link>
          <Link
            href="/profile"
            className="action-card flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
              <User size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Profile</p>
              <p className="text-xs text-[var(--text-secondary)]">Your account</p>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="stat-card p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
                <Loader2 size={13} className="text-blue-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Active
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">{activeJobs}</p>
          </div>
          <div className="stat-card p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/10">
                <CheckCircle size={13} className="text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Completed
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-emerald-500">
              {completedJobs}
            </p>
          </div>
          <div className="stat-card p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/10">
                <XCircle size={13} className="text-red-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Failed
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-red-500">
              {failedJobs}
            </p>
          </div>
          <div className="stat-card p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-surface)]">
                <ImageIcon size={13} className="text-[var(--text-tertiary)]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Total
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">{jobs.length}</p>
          </div>

          {/* Generation Quota */}
          <div className={`stat-card p-5 ${
            genLimit?.isDevMode
              ? "ring-1 ring-amber-500/20"
              : genLimit && !genLimit.canGenerate
                ? "ring-1 ring-red-500/20"
                : ""
          }`}>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                genLimit?.isDevMode
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10"
                  : "bg-gradient-to-br from-violet-500/20 to-purple-500/10"
              }`}>
                {genLimit?.isDevMode ? (
                  <Infinity size={13} className="text-amber-500" />
                ) : (
                  <Zap size={13} className="text-violet-500" />
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                {genLimit?.isDevMode ? "Quota" : "Remaining"}
              </p>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              {genLimit?.isDevMode ? (
                <span className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Unlimited
                </span>
              ) : genLimit ? (
                <>
                  <p className={`text-3xl font-bold tabular-nums ${
                    genLimit.canGenerate ? "text-[var(--accent)]" : "text-red-500"
                  }`}>
                    {genLimit.remaining}
                  </p>
                  <span className="text-sm text-[var(--text-secondary)]">/ {genLimit.limit}</span>
                </>
              ) : (
                <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
              )}
            </div>
            {genLimit && !genLimit.isDevMode && (
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: genLimit.limit }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < genLimit.used ? "bg-violet-500" : "bg-[var(--border)]"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Gallery */}
          <section className="card p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)]" />
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Results</h2>
            </div>
            <p className="mt-1 ml-3.5 text-xs text-[var(--text-tertiary)]">
              Click to open, hover for actions.
            </p>

            {completedWithOutput.length === 0 ? (
              <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-surface)]">
                  <ImageIcon size={24} className="text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm font-semibold">No results yet</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Create a new project to get started.
                </p>
                <Link href="/create" className="button button-primary mt-4">
                  Create
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {completedWithOutput.slice(0, 9).map((job) => (
                  <div
                    key={job.id}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={job.outputUrl!}
                      alt={job.styleName ?? "Generated image"}
                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onClick={() => setLightbox(job)}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <p className="text-xs font-medium text-white drop-shadow">
                        {job.styleName ?? "Custom"}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox(job);
                          }}
                          className="pointer-events-auto rounded-md bg-white/20 p-1.5 text-white backdrop-blur hover:bg-white/30"
                          title="View"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(job.id);
                          }}
                          disabled={deletingId === job.id}
                          className="pointer-events-auto rounded-md bg-red-500/20 p-1.5 text-white backdrop-blur hover:bg-red-500/40 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === job.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <aside className="card p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--accent)] to-amber-500" />
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Activity</h2>
              </div>
              <div className="flex gap-1">
                {/* Filter dropdown */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StatusFilter)
                    }
                    className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 pl-7 text-xs font-medium text-[var(--text)] transition focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="ALL">All</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="QUEUED">Queued</option>
                    <option value="FAILED">Failed</option>
                  </select>
                  <Filter
                    size={12}
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                  />
                </div>
                {/* Sort toggle */}
                <button
                  onClick={() =>
                    setSortMode((m) => (m === "newest" ? "oldest" : "newest"))
                  }
                  className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text)] hover:border-[var(--border-strong)]"
                  title={`Sort by ${sortMode === "newest" ? "oldest" : "newest"} first`}
                >
                  <ArrowUpDown size={12} />
                  {sortMode === "newest" ? "New" : "Old"}
                </button>
              </div>
            </div>

            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
              {displayJobs.length > 0
                ? `Showing ${displayJobs.length} of ${filteredJobs.length} jobs.`
                : "No matching jobs found."}
            </p>

            <div className="mt-4 space-y-2">
              {displayJobs.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] py-8 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-surface)]">
                    <ImageIcon size={18} className="text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm font-semibold">
                    {statusFilter === "ALL" ? "No jobs yet" : "No matching jobs"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {statusFilter === "ALL"
                      ? "Upload an image to start."
                      : "Try a different filter."}
                  </p>
                </div>
              )}
              {displayJobs.map((job) => (
                <div
                  key={job.id}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-3 transition-all hover:border-[var(--border-strong)]"
                >
                  {job.outputUrl ? (
                    <button
                      onClick={() => setLightbox(job)}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={job.outputUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover transition hover:ring-2 hover:ring-[var(--ring)]"
                      />
                    </button>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)]">
                      {statusIcon(job.status)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {job.styleName ?? "Generation"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      {statusIcon(job.status)}
                      <span>{statusLabel(job.status)}</span>
                      <span className="text-[var(--border)]">&middot;</span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                    {job.outputUrl && (
                      <button
                        onClick={() => setLightbox(job)}
                        className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                        title="Open"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingId === job.id}
                      className="rounded-md p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-[var(--danger)] disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === job.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}