import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { loadNavUser } from "@/lib/interest/nav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kitchen Sink",
    template: "%s · Kitchen Sink",
  },
  description: "Match therapists to patients by must-have tags.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navUser = await loadNavUser();

  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader initialNavUser={navUser} />
        {children}
      </body>
    </html>
  );
}
