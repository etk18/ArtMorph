"use client";

import { useCreationStore } from "@/store/creation";
import { UploadCard } from "@/components/upload-card";
import { StyleBrowser } from "@/components/style-browser";
import { apiFetch } from "@/lib/api";
import { ArrowRight, CheckCircle, Loader2, AlertTriangle, Infinity, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type GenerationLimit = {
    limit: number;
    used: number;
    remaining: number;
    isDevMode: boolean;
    canGenerate: boolean;
};

export default function CreatePage() {
    const {
        step,
        setStep,
        inputImage,
        selectedStyle,
        prompt,
        setPrompt,
        generation,
        setGeneration,
        reset
    } = useCreationStore();

    const [genLimit, setGenLimit] = useState<GenerationLimit | null>(null);

    // Track polling interval for cleanup
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchLimit = useCallback(async () => {
        try {
            const data = await apiFetch<GenerationLimit>("/profile/generation-limit");
            setGenLimit(data);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        fetchLimit();
    }, [fetchLimit]);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, []);

    const handleGenerate = async () => {
        if (!inputImage || !selectedStyle) return;
        if (genLimit && !genLimit.canGenerate) return;

        setGeneration({ status: "processing", error: null });
        setStep(3);

        try {
            const { job } = await apiFetch<{ job: { id: string } }>("/jobs", {
                method: "POST",
                body: JSON.stringify({
                    inputImageId: inputImage.id,
                    styleConfigId: selectedStyle.id,
                    prompt
                })
            });
            const jobId = job.id;

            // Refresh limit counter
            fetchLimit();

            setGeneration({ jobId, status: "processing" });
            pollStatus(jobId);
        } catch (err) {
            const apiErr = err as { status?: number; message?: string };
            if (apiErr.status === 403) {
                // Limit exceeded — refresh the limit data
                fetchLimit();
            }
            setGeneration({
                status: "failed",
                error: apiErr.message ?? "Failed to start job"
            });
        }
    };

    const pollStatus = (jobId: string) => {
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        let pollCount = 0;
        const MAX_POLLS = 150; // 5 minutes at 2s intervals

        pollIntervalRef.current = setInterval(async () => {
            pollCount++;

            // Safety timeout — stop after 5 minutes
            if (pollCount >= MAX_POLLS) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                setGeneration({
                    status: "failed",
                    error: "Generation timed out. Check your dashboard for results."
                });
                return;
            }

            try {
                const response = await apiFetch<{
                    status: string;
                    job: {
                        status: string;
                        outputUrl?: string | null;
                        errorMessage?: string | null;
                    };
                }>(`/jobs/${jobId}`);

                const job = response.job;

                if (job.status === "COMPLETED") {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setGeneration({
                        status: "completed",
                        resultUrl: job.outputUrl ?? null
                    });
                } else if (job.status === "FAILED") {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setGeneration({
                        status: "failed",
                        error: job.errorMessage || "Generation failed"
                    });
                }
            } catch {
                // ignore transient errors
            }
        }, 2000);
    };

    const handleNewProject = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        reset();
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 pb-20">
            {/* Generation Limit Banner */}
            {genLimit && (
                <div
                    className={`flex flex-col gap-3 rounded-2xl border p-3 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:px-5 ${
                        genLimit.isDevMode
                            ? "border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/15"
                            : genLimit.canGenerate
                              ? "border-blue-100 bg-blue-50/60 dark:border-blue-800/30 dark:bg-blue-900/10"
                              : "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/15"
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        {genLimit.isDevMode ? (
                            <>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-800/30">
                                    <Infinity size={14} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="font-medium text-amber-700 dark:text-amber-300">
                                    Developer Mode &mdash; Unlimited
                                </span>
                            </>
                        ) : genLimit.canGenerate ? (
                            <>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800/30">
                                    <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-blue-700 dark:text-blue-300">
                                    <span className="font-semibold">{genLimit.remaining}</span> of {genLimit.limit} generations remaining
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-800/30">
                                    <AlertTriangle size={14} className="text-red-500" />
                                </div>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    Generation limit reached ({genLimit.used}/{genLimit.limit})
                                </span>
                            </>
                        )}
                    </div>
                    {!genLimit.isDevMode && (
                        <div className="flex items-center gap-1">
                            {Array.from({ length: genLimit.limit }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full transition-colors ${
                                        i < genLimit.used
                                            ? "bg-blue-500"
                                            : "bg-[var(--border)]"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Stepper */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
                {[
                    { num: 1, label: "Upload" },
                    { num: 2, label: "Style" },
                    { num: 3, label: "Generate" }
                ].map((s, idx) => (
                    <div key={s.num} className="flex flex-1 items-center gap-1.5 sm:gap-2">
                        <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            step >= s.num
                                ? "bg-[var(--accent)] text-white shadow-sm"
                                : "border border-[var(--border)] text-[var(--muted)]"
                        }`}>
                            {step > s.num ? <CheckCircle size={14} /> : s.num}
                        </div>
                        <span className={`hidden font-semibold uppercase tracking-wider text-xs xs:inline sm:inline ${
                            step >= s.num ? "text-[var(--text)]" : "text-[var(--muted)]"
                        }`}>
                            {s.label}
                        </span>
                        {idx < 2 && (
                            <div className={`h-px flex-1 ${
                                step > s.num ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                            }`} />
                        )}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <UploadCard
                        onSuccess={(img) => {
                            // Proceed automatically if already uploaded, or let user review
                            setStep(2);
                        }}
                    />
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="section-title">Choose a style</h1>
                            <p className="text-[var(--muted)]">
                                Select the artistic direction for your transformation.
                            </p>
                        </div>
                        {selectedStyle && (
                            <button
                                onClick={handleGenerate}
                                className="button button-primary"
                                disabled={genLimit !== null && !genLimit.canGenerate}
                            >
                                Generate <ArrowRight size={16} className="ml-2" />
                            </button>
                        )}
                    </div>

                    <StyleBrowser />

                    {selectedStyle && (
                        <div className="card sticky bottom-4 sm:bottom-6 z-10 border-aurora-200 bg-aurora-50 p-3 sm:p-4 shadow-xl dark:border-aurora-900/50 dark:bg-aurora-900/20">
                            <div className="flex flex-col gap-4 md:flex-row">
                                <input
                                    type="text"
                                    placeholder="Optional: Describe the scene or add context..."
                                    className="input flex-1 bg-white dark:bg-black"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <button
                                    onClick={handleGenerate}
                                    className="button button-primary whitespace-nowrap"
                                    disabled={genLimit !== null && !genLimit.canGenerate}
                                >
                                    {genLimit && !genLimit.canGenerate ? "Limit Reached" : "Generate Art"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="card flex min-h-[300px] sm:min-h-[400px] flex-col items-center justify-center p-6 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                    {generation.status === "processing" && (
                        <>
                            <Loader2 className="mb-6 h-12 w-12 animate-spin text-aurora-600" />
                            <h2 className="text-2xl font-semibold">Transforming...</h2>
                            <p className="mt-2 text-[var(--muted)]">
                                Our AI is reimagining your image. This usually takes 10-20
                                seconds.
                            </p>
                        </>
                    )}

                    {generation.status === "completed" && (
                        <div className="w-full">
                            <div className="mb-6 flex justify-center text-emerald-500">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="mb-6 sm:mb-8 text-xl sm:text-2xl font-semibold">Transformation Complete</h2>
                            {generation.resultUrl ? (
                                <div className="grid gap-4 sm:gap-8 grid-cols-1 sm:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Original</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={inputImage?.previewUrl} alt="Original" className="rounded-2xl border border-[var(--border)]" />
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Result</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={generation.resultUrl} alt="Generated result" className="rounded-2xl border-4 border-aurora-500 shadow-2xl" />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted)]">
                                    Your image was generated successfully. View it on the dashboard.
                                </p>
                            )}
                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                <button onClick={() => setStep(2)} className="button button-ghost">Back to Styles</button>
                                {generation.resultUrl && (
                                    <a href={generation.resultUrl} download className="button button-primary">Download HD</a>
                                )}
                                <Link href="/dashboard" className="button button-ghost">View Dashboard</Link>
                                <button onClick={handleNewProject} className="button button-ghost">New Project</button>
                            </div>
                        </div>
                    )}

                    {generation.status === "failed" && (
                        <div className="text-ember-500">
                            <h2 className="text-xl font-semibold">Generation Failed</h2>
                            <p className="mt-2">{generation.error}</p>
                            <button onClick={() => setStep(2)} className="button button-ghost mt-6">Try Again</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
