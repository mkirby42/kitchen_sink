import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

/** Phone Find card. Desktop grid and one-at-a-time use FindDirectoryCard. */
export function TherapistCard({
  row,
  filters,
}: {
  row: SearchRow;
  filters: SearchFilters;
}) {
  return (
    <Card as="article" className="overflow-hidden p-0">
      <TherapistCardPhone row={row} filters={filters} />
    </Card>
  );
}
