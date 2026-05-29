import type { Metadata } from "next";
import { Luckiest_Guy } from "next/font/google";
import "./globals.css";
import { FootballDecor } from "@/components/FootballDecor";
import { Nav } from "@/components/Nav";
import { SiteHeader } from "@/components/SiteHeader";

const displayFont = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SUPER VMAPP — Kontorspool VM 2026",
  description:
    "Tippa gruppmatcher och slutspel. 100 kr i potten. Heja Sverige!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={displayFont.variable}>
      <body className="antialiased">
        <FootballDecor />
        <div className="app-shell app-shell--wide mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <SiteHeader />
          <Nav />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
