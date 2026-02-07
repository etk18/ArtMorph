import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "ArtMorph",
  description: "Context-aware image transformation for creators"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen">
            <div className="noise" />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
