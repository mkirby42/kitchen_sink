import { Card } from "@/components/ui/Card";
import { smallLabelClass } from "@/components/ui/styles";
import { ProfileHeading } from "./ProfileHeading";
import { TagPills } from "./TagPills";

export function DesktopPractice({
  givenName,
  specialties,
  modalities,
  className = "mt-10",
}: {
  givenName: string;
  specialties: string[];
  modalities: string[];
  className?: string;
}) {
  if (specialties.length === 0 && modalities.length === 0) return null;

  return (
    <section className={className}>
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
      </Card>
    </section>
  );
}
