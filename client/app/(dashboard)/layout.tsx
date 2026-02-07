import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen flex flex-col">
        {/* Decorative background orbs */}
        <div className="orb orb-blue fixed -top-40 -right-40 h-[500px] w-[500px] opacity-[0.07]" />
        <div className="orb orb-purple fixed -bottom-60 -left-60 h-[600px] w-[600px] opacity-[0.05]" />

        <Navbar />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-3 sm:px-6 pb-8 pt-2">
          {children}
        </main>
        <footer className="creator-footer relative z-10">
          <span className="opacity-60">Crafted by</span>{" "}
          <span className="font-medium text-[var(--text)] opacity-80">
            Eesh Sagar Singh
          </span>
        </footer>
      </div>
    </AuthGuard>
  );
}
