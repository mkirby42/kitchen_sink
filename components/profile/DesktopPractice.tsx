import { Card } from "@/components/ui/Card";
import { ProfileHeading } from "./ProfileHeading";

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
      <ProfileHeading lead={`How ${givenName}`} accent="works" />
      <Card className="mt-4 px-5 py-5 sm:px-6">
        {specialties.length > 0 ? (
          <div>
            <h3 className="font-display text-lg italic text-clay">
              Areas of Interest
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {specialties.map((label) => (
                <li
                  key={label}
                  className="max-w-full rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium whitespace-normal text-paper"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {modalities.length > 0 ? (
          <div className={specialties.length > 0 ? "mt-5" : undefined}>
            <h3 className="font-display text-lg italic text-clay">
              Approach in Therapy
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {modalities.map((label) => (
                <li
                  key={label}
                  className="max-w-full rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium whitespace-normal text-ink"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {hasTags && hasQualifications ? (
          <div className="my-5 border-t border-line" />
        ) : null}
        {education.length > 0 ? (
          <div>
            <h3 className="font-display text-lg italic text-clay">Education</h3>
            <ul className="mt-1 space-y-1 text-[15px] text-ink">
              {education.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {credentials.length > 0 ? (
          <div className={education.length > 0 ? "mt-4" : undefined}>
            <h3 className="font-display text-lg italic text-clay">
              Credentials
            </h3>
            <ul className="mt-1 space-y-1 text-[15px] text-ink">
              {credentials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
