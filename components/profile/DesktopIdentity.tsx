import { Card } from "@/components/ui/Card";
import { metaLineClass, therapistNameClass } from "@/components/ui/styles";
import { sentenceCaseSegments } from "@/lib/copy/sentence-case";
import {
  cashPayOffered,
  practiceFeeRows,
  type ConsultBookAction,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import { ContactCtas } from "./ContactCtas";
import { FeeRows } from "./FeeRows";
import { NotAcceptingClients } from "./NotAcceptingClients";
import { SessionFormatLine } from "./SessionFormatLine";
import { credentialLine, yearsPracticingLabel } from "./copy";

export function DesktopIdentity({
  data,
  formats,
  licenses,
  officeLines,
  sliding,
  superbill,
  actions,
}: {
  data: TherapistProfileData;
  formats: string[];
  licenses: string[];
  officeLines: string[];
  sliding: string | null;
  superbill: boolean;
  actions: ConsultBookAction[];
}) {
  const summary = credentialLine(data.credential, data.credentials);
  const years = yearsPracticingLabel(data.years);
  const fees = practiceFeeRows({
    rates: data.rates,
    sliding,
    inNetwork: data.inNetwork,
    cashPay: cashPayOffered(data.insurance),
    superbill,
  });
  const showLedger = fees.length > 0 || officeLines.length > 0;

  return (
    <Card className="mt-4 px-5 py-5 sm:px-6">
      <h1 className={therapistNameClass}>{data.name}</h1>
      {summary ? (
        <p className={`mt-2 ${metaLineClass}`}>{sentenceCaseSegments(summary)}</p>
      ) : null}
      {licenses.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {licenses.map((line) => (
            <p key={line} className={metaLineClass}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {years ? <p className={`mt-1 ${metaLineClass}`}>{years}</p> : null}
      <NotAcceptingClients open={data.openToNewClients} className="mt-3" />
      {formats.length > 0 ? (
        <div className="mt-3">
          <SessionFormatLine formats={formats} />
        </div>
      ) : null}
      <ContactCtas
        name={data.givenName}
        actions={actions}
        contact={data.contact}
        therapistId={data.id}
        placement="stack"
      />
      {showLedger ? (
        <dl className="mt-4 divide-y divide-line border-t border-line text-sm">
          <FeeRows rows={fees} />
          {officeLines.length > 0 ? (
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-mute">Office</dt>
              <dd className={`text-right not-italic ${metaLineClass}`}>
                {officeLines.map((line, index) => (
                  <span key={`${index}-${line}`} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </Card>
  );
}

