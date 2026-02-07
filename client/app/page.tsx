import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 sm:px-6 py-16 sm:py-20">
        <h1 className="brand-logo-lg mb-2">ArtMorph</h1>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Studio
        </p>
        <h2 className="mt-6 sm:mt-8 font-display text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">
          Transform images without<br className="hidden sm:inline" />losing the story.
        </h2>
        <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base text-[var(--text-secondary)]">
          ArtMorph preserves pose, depth, and composition while applying style
          configurations tuned for storyboard artists and designers.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="button button-primary">
            Create account
          </Link>
          <Link href="/login" className="button button-ghost">
            Sign in
          </Link>
        </div>
      </div>
      <footer className="creator-footer">
        <span className="opacity-60">Crafted by</span>{" "}
        <span className="font-medium text-[var(--text)] opacity-80">Eesh Sagar Singh</span>
      </footer>
    </main>
  );
}
