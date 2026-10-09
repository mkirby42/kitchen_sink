import { sectionTitleClass } from "@/components/ui/styles";

export function ProfileHeading({
  lead,
  accent,
}: {
  lead: string;
  accent: string;
}) {
  return (
    <h2 className={`text-ink ${sectionTitleClass}`}>
      {lead} <em className="text-clay">{accent}</em>
    </h2>
  );
}
