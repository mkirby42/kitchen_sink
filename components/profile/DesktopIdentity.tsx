import { Card } from "@/components/ui/Card";
import { metaLineClass, therapistNameClass } from "@/components/ui/styles";
import { sentenceCaseSegments } from "@/lib/copy/sentence-case";
import { formatUsdFromCents } from "@/lib/therapists/display";
import type {
  ConsultBookAction,
  TherapistProfileData,
} from "@/lib/therapists/load";
import { ContactCtas } from "./ContactCtas";
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
      {formats.length > 0 ? (
        <div className="mt-3">
          <SessionFormatLine formats={formats} />
        </div>
      ) : null}
      <ContactCtas
        name={data.givenName}
        actions={actions}
        contact={data.contact}
        placement="stack"
      />
      <dl className="mt-4 divide-y divide-line border-t border-line text-sm">
        {data.rates.map((rate) => (
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
        <div className="flex items-start justify-between gap-4 py-3">
          <dt className="text-mute">In-network</dt>
          <dd className="max-w-[62%] text-right font-medium text-body">
            {data.inNetwork.length > 0
              ? data.inNetwork.join(" · ")
              : "None listed"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-mute">Out-of-network</dt>
          <dd className="font-medium text-body">
            {superbill ? "Superbill provided" : "Not listed"}
          </dd>
        </div>
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
    </Card>
  );
}

