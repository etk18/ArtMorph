export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden flex-col justify-between bg-zinc-950 px-12 py-16 text-white lg:flex">
        <div>
          <p className="brand-logo">ArtMorph</p>
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">
            Visual continuity meets<br />bold experimentation.
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            Workflows designed for creators who want precision, not randomness.
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400 italic">
            &ldquo;The fastest way to match a storyboard to a new visual language.&rdquo;
          </div>
          <p className="text-xs text-zinc-600">
            Crafted by <span className="text-zinc-400">Eesh Sagar Singh</span>
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-6 text-center lg:hidden">
            <p className="brand-logo">ArtMorph</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Studio</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
