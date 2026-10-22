import { Suspense } from "react";
import { PhoneFind } from "@/components/search/PhoneFind";
import { loadPhoneStackExtras } from "@/lib/search/phone-stack";
import type { SearchRow } from "@/lib/search/rpc";

export async function PhoneFindSection({ rows }: { rows: SearchRow[] | null }) {
  const extras = rows?.length
    ? await loadPhoneStackExtras(rows.map((row) => row.profile_id))
    : [];
  return (
    <Suspense fallback={null}>
      <PhoneFind rows={rows} extras={extras} />
    </Suspense>
  );
}
