import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import type { StackCard } from "@/lib/search/phone-find";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

/** Phone Find card. Desktop grid and one-at-a-time use FindDirectoryCard. */
export function TherapistCard({
  row,
  filters,
  cards,
}: {
  row: SearchRow;
  filters: SearchFilters;
  cards?: readonly StackCard[];
}) {
  return (
    <Card as="article" className="overflow-hidden p-0">
      <TherapistCardPhone row={row} filters={filters} cards={cards} />
    </Card>
  );
}
