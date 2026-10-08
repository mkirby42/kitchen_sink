import { Eyebrow } from "@/components/ui/Eyebrow";
import { tagClass } from "@/components/ui/styles";
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
}) {
  const aboutCopy = showAbout === false ? null : about;
  const logistics = showLogistics !== false;

  if (!aboutCopy && !logistics) return null;
  if (!logistics) {
    return <p className="text-[17px] leading-relaxed text-ink">{aboutCopy}</p>;
  }

  return (
    <div>
      {aboutCopy ? (
        <p className="text-[17px] leading-relaxed text-ink">{aboutCopy}</p>
      ) : null}
      <div
        className={`${showAbout === false ? "mt-4" : "mt-5"} rounded-card bg-clay/10 px-5 py-5 sm:px-6`}
      >
        <Eyebrow>Logistics</Eyebrow>
        {formats.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {formats.map((label) => (
              <li key={label} className={tagClass(false)}>
                {label}
              </li>
            ))}
          </ul>
        ) : null}
        {officeLines.length > 0 ? (
          <address className="mt-3 text-sm text-ink not-italic">
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
              <dt className="text-ink">
                {rate.service_type} session ({rate.duration_minutes} min)
              </dt>
              <dd className="font-medium text-ink">
                {formatUsdFromCents(rate.price_cents)}
              </dd>
            </div>
          ))}
          {sliding ? (
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-ink">Sliding scale</dt>
              <dd className="font-medium text-ink">{sliding}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-ink">In-network</dt>
            <dd className="text-right font-medium text-ink">
              {inNetwork.length > 0 ? inNetwork.join(" · ") : "None listed"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-ink">Out-of-network</dt>
            <dd className="font-medium text-ink">
              {superbill ? "Superbill provided" : "Not listed"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
