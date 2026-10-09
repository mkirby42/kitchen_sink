import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { canonicalOrigin } from "@/lib/site";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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

  return (
    <html lang="en" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader initialNavUser={navUser} audience={audience} />
        {children}
      </body>
    </html>
  );
}
