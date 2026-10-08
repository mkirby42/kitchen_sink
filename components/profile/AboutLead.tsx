import { splitAboutLead } from "./copy";

export function AboutLead({ about }: { about: string | null }) {
  const { lead, paragraphs } = splitAboutLead(about);
  if (!lead && paragraphs.length === 0) return null;

  return (
    <div data-about-lead>
      {lead ? (
        <p className="font-display text-[1.65rem] leading-snug font-semibold tracking-tight text-ink">
          {lead}
        </p>
      ) : null}
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className={`${lead || index > 0 ? "mt-4" : ""} text-[17px] leading-relaxed text-ink`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
