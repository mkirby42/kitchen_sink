import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { metaLineClass, softTagClass, textLinkClass } from "@/components/ui/styles";
import { credentialLine, type ShareTherapist } from "@/lib/referrals/email";
import { routes } from "@/lib/routes";
import { Initials, ReferralShell } from "./ReferralBits";

export function ShareList({ therapists }: { therapists: ShareTherapist[] }) {
  return (
    <ReferralShell
      eyebrow="Kitchen Sink"
      title="Therapists for you"
      lede="Take a look and reach out to whoever feels right. This page does not include the referral request."
    >
      {therapists.length === 0 ? (
        <Card className="px-4 py-4">
          <p className="text-sm text-mute">Those profiles are not available.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {therapists.map((therapist) => {
            const labels = [
              ...therapist.specialtyLabels,
              ...therapist.insuranceLabels,
            ].slice(0, 4);
            return (
              <Card as="li" key={therapist.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <Initials name={therapist.name} />
                  <div className="min-w-0">
                    <p className="font-medium text-copy">
                      {credentialLine(therapist.name, therapist.credential)}
                    </p>
                    {labels.length ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {labels.map((label) => (
                          <li key={label} className={softTagClass}>
                            {label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`mt-1 ${metaLineClass}`}>Kitchen Sink profile</p>
                    )}
                    <Link
                      href={routes.therapist(therapist.id)}
                      className={`mt-3 inline-block ${textLinkClass}`}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </ReferralShell>
  );
}
