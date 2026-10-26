import { bodyCopyClass, metaLineClass, profileSectionHeadingClass } from "@/components/ui/styles";
import {
  publicCredentialLines,
  publicEducationLines,
} from "@/lib/profile/public-facts";
import { practiceFeeRows, type TherapistProfileData } from "@/lib/therapists/load";
import { FeeRows } from "./FeeRows";
import { NotAcceptingClients } from "./NotAcceptingClients";
import { QualificationFacts } from "./QualificationFacts";
import { SessionFormatLine } from "./SessionFormatLine";

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
  openToNewClients,
  cashPay = false,
  profileId,
  education = [],
  credentials = [],
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
  /** Missing means open, so an older caller does not flash a closed pill. */
  openToNewClients?: boolean;
  cashPay?: boolean;
  profileId?: string;
  education?: readonly string[];
  credentials?: readonly string[];
}) {
  const aboutCopy = showAbout === false ? null : about;
  const logistics = showLogistics !== false;
  const fees = logistics
    ? practiceFeeRows({
        rates,
        sliding,
        inNetwork,
        cashPay,
        superbill,
      })
    : [];
  const educationLines =
    logistics && profileId ? publicEducationLines(profileId, education) : [];
  const credentialLines = logistics ? publicCredentialLines(credentials) : [];
  const hasLogistics =
    formats.length > 0 ||
    officeLines.length > 0 ||
    fees.length > 0 ||
    educationLines.length > 0 ||
    credentialLines.length > 0;

  if (!aboutCopy && !logistics) return null;
  if (!logistics) {
    return <p className={bodyCopyClass}>{aboutCopy}</p>;
  }
  if (!aboutCopy && !hasLogistics && openToNewClients !== false) return null;

  return (
    <div>
      {aboutCopy ? (
        <p className={bodyCopyClass}>{aboutCopy}</p>
      ) : null}
      <NotAcceptingClients
        open={openToNewClients}
        className={showAbout === false ? "mt-4" : "mt-5"}
      />
      {hasLogistics ? (
        <div
          className={`${
            showAbout === false || openToNewClients === false ? "mt-4" : "mt-5"
          } rounded-card bg-lavender px-5 py-5 sm:px-6`}
        >
          <h2 className={profileSectionHeadingClass}>How {givenName} works</h2>
          {formats.length > 0 ? (
            <div className="mt-3">
              <SessionFormatLine formats={formats} />
            </div>
          ) : null}
          {profileId && (educationLines.length > 0 || credentialLines.length > 0) ? (
            <QualificationFacts
              profileId={profileId}
              education={education}
              credentials={credentials}
            />
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
          {fees.length > 0 ? (
            <dl className="mt-3 divide-y divide-line text-sm">
              <FeeRows rows={fees} />
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
