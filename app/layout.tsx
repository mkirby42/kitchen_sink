import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { canonicalOrigin } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin()),
  title: {
    default: "Kitchen Sink",
    template: "%s · Kitchen Sink",
  },
  description:
    "Find a therapist by the tags you need. Kitchen Sink shows therapists who match some of them.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navUser, audience] = await Promise.all([
    loadNavUser(),
    readAudienceCookie(),
  ]);

  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader initialNavUser={navUser} audience={audience} />
        {children}
      </body>
    </html>
  );
}
