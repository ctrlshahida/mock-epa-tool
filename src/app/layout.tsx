import type { Metadata } from "next";
import Link from "next/link";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EPA Mock Assessment Simulator",
  description:
    "Practice tool for the Software Developer L4 EPA (ST0116): professional discussion and project questioning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight"
            >
              EPA Simulator
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/" className="text-muted hover:text-foreground">
                Practice
              </Link>
              <Link href="/dashboard" className="text-muted hover:text-foreground">
                Dashboard
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
