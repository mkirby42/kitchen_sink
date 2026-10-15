import type { Metadata, Viewport } from "next";
import { Caprasimo, DM_Sans, Fraunces } from "next/font/google";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { SiteHeader } from "@/components/SiteHeader";
import { analyticsDataset } from "@/lib/analytics/payload";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { canonicalOrigin } from "@/lib/site";
import "./globals.css";

const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caprasimo",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
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

  const trackVisits = analyticsDataset(navUser?.role) === "on";

  return (
    <html
      lang="en"
      data-ks-analytics={analyticsDataset(navUser?.role)}
      className={`${caprasimo.variable} ${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <SiteHeader initialNavUser={navUser} audience={audience} />
        <SiteAnalytics enabled={trackVisits} />
        {children}
      </body>
    </html>
  );
}
