import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-6">
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
