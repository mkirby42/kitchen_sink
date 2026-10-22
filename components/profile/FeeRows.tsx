import type { PracticeFeeRow } from "@/lib/therapists/load";

export function FeeRows({ rows }: { rows: readonly PracticeFeeRow[] }) {
  return rows.map((row, index) => (
    <div
      key={`${row.label}-${index}`}
      className="flex items-start justify-between gap-4 py-3"
    >
      <dt className="min-w-0 break-words text-mute">{row.label}</dt>
      <dd className="max-w-[62%] text-right font-medium text-body">{row.value}</dd>
    </div>
  ));
}
