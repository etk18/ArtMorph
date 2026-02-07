export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left panel — immersive brand */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#09090b] px-12 py-16 text-white lg:flex">
        {/* Gradient orb */}
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600/20 to-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-600/15 to-violet-500/10 blur-3xl" />
        <div className="relative z-10">
          <p className="brand-logo !text-2xl">ArtMorph</p>
          <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight leading-[1.15]">
            Visual continuity meets<br />
            <span className="gradient-text">bold experimentation.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-400">
            Workflows designed for creators who want precision, not randomness.
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-zinc-400 italic backdrop-blur-sm">
            &ldquo;The fastest way to match a storyboard to a new visual language.&rdquo;
          </div>
          <p className="text-xs text-zinc-600">
            Crafted by{" "}
            <span className="text-zinc-400">Eesh Sagar Singh</span>
          </p>
        </div>
      </section>

      {/* Right panel — form */}
      <section className="flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-8 text-center lg:hidden">
            <p className="brand-logo !text-2xl">ArtMorph</p>
            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
              AI Style Transfer Studio
            </p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
