import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Eye } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Hero */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 sm:px-6 py-20 sm:py-28">
        {/* Badge */}
        <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md">
          <Sparkles size={12} className="text-[var(--accent)]" />
          AI-Powered Style Transfer
        </div>

        <h1 className="brand-logo-lg">ArtMorph</h1>

        <h2 className="mt-6 sm:mt-8 max-w-2xl font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
          Transform images without{" "}
          <span className="gradient-text">losing the story.</span>
        </h2>

        <p className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
          ArtMorph preserves pose, depth, and composition while applying style
          configurations tuned for storyboard artists and designers.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[var(--accent-surface)] px-4 py-2 text-xs font-medium text-[var(--accent)]">
            <Layers size={13} /> 22 Curated Styles
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[var(--accent-surface)] px-4 py-2 text-xs font-medium text-[var(--accent)]">
            <Eye size={13} /> Context-Aware
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[var(--accent-surface)] px-4 py-2 text-xs font-medium text-[var(--accent)]">
            <Sparkles size={13} /> FLUX.1 Kontext
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="button button-primary px-6 py-2.5 text-sm"
          >
            Get Started Free
            <ArrowRight size={15} className="ml-1" />
          </Link>
          <Link
            href="/login"
            className="button button-ghost px-6 py-2.5 text-sm"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="creator-footer">
        <span className="opacity-60">Crafted by</span>{" "}
        <span className="font-medium text-[var(--text)] opacity-80">
          Eesh Sagar Singh
        </span>
      </footer>
    </main>
  );
}
