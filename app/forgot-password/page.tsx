import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; return?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordForm from={params.from} returnTo={params.return} />;
}
