import type { Metadata, Viewport } from "next";
import { Caprasimo, DM_Sans, Fraunces } from "next/font/google";
import { cookies, headers } from "next/headers";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { PasswordUpdatedNote } from "@/components/auth/PasswordUpdatedNote";
import { SiteHeader } from "@/components/SiteHeader";
import { JsFlag } from "@/components/ui/JsFlag";
import { analyticsDataset } from "@/lib/analytics/payload";
import { PASSWORD_UPDATED_COOKIE } from "@/lib/auth/password-reset";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { canonicalOrigin } from "@/lib/site";
import { PASSWORD_UPDATED_HEADER } from "@/lib/supabase/update-session";
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
  const [navUser, audience, headerList, cookieStore] = await Promise.all([
    loadNavUser(),
    readAudienceCookie(),
    headers(),
    cookies(),
  ]);

  const trackVisits = analyticsDataset(navUser?.role) === "on";
  const passwordUpdated =
    headerList.get(PASSWORD_UPDATED_HEADER) === "1" ||
    cookieStore.get(PASSWORD_UPDATED_COOKIE)?.value === "1";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-ks-analytics={analyticsDataset(navUser?.role)}
      className={`${caprasimo.variable} ${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <JsFlag />
        <SiteHeader initialNavUser={navUser} audience={audience} />
        <SiteAnalytics enabled={trackVisits} />
        {passwordUpdated ? <PasswordUpdatedNote /> : null}
        {children}
      </body>
    </html>
  );
}
