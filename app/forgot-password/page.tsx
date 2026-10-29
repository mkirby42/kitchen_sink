import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { readAuthQuery } from "@/lib/auth/auth-query";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; return?: string; error?: string; email?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const flash = readAuthQuery(params);
  return (
    <ForgotPasswordForm
      from={params.from}
      returnTo={params.return}
      initialEmail={flash.email}
      initialError={flash.sent === "1" ? "" : flash.error}
      initialSent={flash.sent === "1"}
    />
  );
}
