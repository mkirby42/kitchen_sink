import { metaLineClass } from "@/components/ui/styles";
import {
  publicCredentialLines,
  publicEducationLines,
} from "@/lib/profile/public-facts";

/** Education and credential rows inside a profile facts card. */
export function QualificationFacts({
  profileId,
  education,
  credentials,
}: {
  profileId: string;
  education: readonly string[];
  credentials: readonly string[];
}) {
  const educationLines = publicEducationLines(profileId, education);
  const credentialLines = publicCredentialLines(credentials);
  if (educationLines.length === 0 && credentialLines.length === 0) return null;

  return (
    <dl className="mt-1 text-sm">
      <FactRow label="Education" lines={educationLines} />
      <FactRow label="Credentials" lines={credentialLines} />
    </dl>
  );
}

function FactRow({ label, lines }: { label: string; lines: readonly string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-mute">{label}</dt>
      <dd className={`text-right not-italic ${metaLineClass}`}>
        {lines.map((line, index) => (
          <span key={`${index}-${line}`} className="block">
            {line}
          </span>
        ))}
      </dd>
    </div>
  );
}
