import { bodyCopyClass, metaLineClass, profileSectionHeadingClass } from "@/components/ui/styles";
import { SessionFormatLine } from "./SessionFormatLine";
import { formatUsdFromCents } from "@/lib/therapists/display";
import type { TherapistProfileData } from "@/lib/therapists/load";

export function AboutPanel({
  about,
  rates,
  inNetwork,
  sliding,
  superbill,
  formats,
  officeLines,
  showAbout = true,
  showLogistics = true,
  givenName,
}: {
  about: string | null;
  rates: TherapistProfileData["rates"];
  inNetwork: string[];
  sliding: string | null;
  superbill: boolean;
  formats: string[];
  officeLines: string[];
  /** Phone puts logistics under the photo and leaves the about line on the Profile tab. */
  showAbout?: boolean;
  showLogistics?: boolean;
  givenName: string;
}) {
  const aboutCopy = showAbout === false ? null : about;
  const logistics = showLogistics !== false;

  if (!aboutCopy && !logistics) return null;
  if (!logistics) {
    return <p className={bodyCopyClass}>{aboutCopy}</p>;
  }

  return (
    <div>
      {aboutCopy ? (
        <p className={bodyCopyClass}>{aboutCopy}</p>
      ) : null}
      <div
        className={`${showAbout === false ? "mt-4" : "mt-5"} rounded-card bg-lavender px-5 py-5 sm:px-6`}
      >
        <h2 className={profileSectionHeadingClass}>How {givenName} works</h2>
        {formats.length > 0 ? (
          <div className="mt-3">
            <SessionFormatLine formats={formats} />
          </div>
        ) : null}
        {officeLines.length > 0 ? (
          <address className={`mt-3 not-italic ${metaLineClass}`}>
            {officeLines.map((line, index) => (
              <span key={`${index}-${line}`} className="block">
                {line}
              </span>
            ))}
          </address>
        ) : null}
        <dl className="mt-3 divide-y divide-line text-sm">
          {rates.map((rate) => (
            <div
              key={`${rate.service_type}-${rate.duration_minutes}`}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="min-w-0 break-words text-mute">
                {rate.service_type} session ({rate.duration_minutes} min)
              </dt>
              <dd className="shrink-0 font-medium text-body">
                {formatUsdFromCents(rate.price_cents)}
              </dd>
            </div>
          ))}
          {sliding ? (
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-mute">Sliding scale</dt>
              <dd className="font-medium text-body">{sliding}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-mute">In-network</dt>
            <dd className="text-right font-medium text-body">
              {inNetwork.length > 0 ? inNetwork.join(" · ") : "None listed"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-mute">Out-of-network</dt>
            <dd className="font-medium text-body">
              {superbill ? "Superbill provided" : "Not listed"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
