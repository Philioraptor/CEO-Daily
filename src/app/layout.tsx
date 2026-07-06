import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEO-Daily",
  description: "A Gamified Strategic Decision-Making Simulator",
  themeColor: "#0B0E14",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex justify-center`}
      >
        <div className="w-full max-w-md min-h-screen bg-[var(--color-bg-base)] relative overflow-hidden flex flex-col border-x border-white/10">
          <AuthProvider>
            <main className="flex-1 flex flex-col overflow-y-auto pb-16">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
