import { Card } from "@/components/ui/Card";
import { therapistNameClass } from "@/components/ui/styles";
import { formatUsdFromCents } from "@/lib/therapists/display";
import type {
  ConsultBookAction,
  TherapistProfileData,
} from "@/lib/therapists/load";
import { ContactCtas } from "./ContactCtas";
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
      {summary ? <p className="mt-2 text-[15px] text-mute">{summary}</p> : null}
      {licenses.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {licenses.map((line) => (
            <p key={line} className="text-sm text-mute">
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {years ? <p className="mt-1 text-sm text-mute">{years}</p> : null}
      {formats.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {formats.map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink"
            >
              {label === "In person" ? <PinIcon /> : <VideoIcon />}
              {label}
            </li>
          ))}
        </ul>
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
            <dt className="text-mute">
              {rate.service_type} session ({rate.duration_minutes} min)
            </dt>
            <dd className="font-medium text-body">
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
            <dd className="text-right text-sm font-medium text-body not-italic">
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

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3.5" y="6.5" width="12" height="11" rx="2" />
      <path d="M15.5 11.5 20.5 8.5v7l-5-3Z" strokeLinejoin="round" />
    </svg>
  );
}
