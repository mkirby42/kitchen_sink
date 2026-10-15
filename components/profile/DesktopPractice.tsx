import { Card } from "@/components/ui/Card";
import { metaLineClass, smallLabelClass } from "@/components/ui/styles";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { ProfileHeading } from "./ProfileHeading";
import { TagPills } from "./TagPills";

export function DesktopPractice({
  givenName,
  specialties,
  modalities,
  education,
  credentials,
}: {
  givenName: string;
  specialties: string[];
  modalities: string[];
  education: string[];
  credentials: string[];
}) {
  const hasTags = specialties.length > 0 || modalities.length > 0;
  const hasQualifications = education.length > 0 || credentials.length > 0;
  if (!hasTags && !hasQualifications) return null;

  return (
    <section className="mt-10">
      <ProfileHeading>{`How ${givenName} works`}</ProfileHeading>
      <Card className="mt-4 px-5 py-5 sm:px-6">
        {specialties.length > 0 ? (
          <div>
            <h3 className={smallLabelClass}>Areas of interest</h3>
            <TagPills labels={specialties} />
          </div>
        ) : null}
        {modalities.length > 0 ? (
          <div className={specialties.length > 0 ? "mt-5" : undefined}>
            <h3 className={smallLabelClass}>Approach in therapy</h3>
            <TagPills labels={modalities} />
          </div>
        ) : null}
        {hasTags && hasQualifications ? (
          <div className="my-5 border-t border-line" />
        ) : null}
        {education.length > 0 ? (
          <div>
            <h3 className={smallLabelClass}>Education</h3>
            <ul className={`mt-1 space-y-1 ${metaLineClass}`}>
              {education.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {credentials.length > 0 ? (
          <div className={education.length > 0 ? "mt-4" : undefined}>
            <h3 className={smallLabelClass}>Credentials</h3>
            <ul className={`mt-1 space-y-1 ${metaLineClass}`}>
              {credentials.map((item) => (
                <li key={item}>{sentenceCasePhrase(item)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
