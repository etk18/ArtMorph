import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen flex flex-col bg-[var(--bg)]">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 pb-10 pt-4">
          {children}
        </main>
        <footer className="creator-footer">
          <span className="opacity-60">Crafted by</span>{" "}
          <span className="font-medium text-[var(--text)] opacity-80">
            Eesh Sagar Singh
          </span>
        </footer>
      </div>
    </AuthGuard>
  );
}
