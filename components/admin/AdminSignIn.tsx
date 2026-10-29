import { AdminAuth } from "@/components/admin/AdminAuth";
import { pageReturnPath, readAuthQuery, type AuthSearch } from "@/lib/auth/auth-query";

export async function AdminSignIn({
  returnPath,
  title,
  lede,
  searchParams,
}: {
  returnPath: string;
  title?: string;
  lede?: string;
  searchParams: Promise<AuthSearch>;
}) {
  const params = await searchParams;
  const flash = readAuthQuery(params);
  return (
    <AdminAuth
      returnPath={pageReturnPath(returnPath, params)}
      title={title}
      lede={lede}
      initialError={flash.error}
      initialEmail={flash.email}
    />
  );
}
