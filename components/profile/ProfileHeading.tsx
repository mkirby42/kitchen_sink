export function ProfileHeading({
  lead,
  accent,
}: {
  lead: string;
  accent: string;
}) {
  return (
    <h2 className="font-display text-3xl leading-tight tracking-tight text-ink md:text-4xl">
      {lead} <em className="text-clay italic">{accent}</em>
    </h2>
  );
}
