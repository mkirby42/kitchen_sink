import Link from "next/link";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";

const formatPillClass =
  "inline-flex items-center rounded-full border border-[#e3dcd2] bg-[#f3efe8] px-3 py-1 text-[13px] leading-none text-[#6f695f]";

function FormatPill({ label }: { label: string }) {
  return <span className={formatPillClass}>{label}</span>;
}

export function TherapistCardPhone({
  name,
  given,
  initials,
  credential,
  photoUrl,
  videoUrl,
  virtual,
  inPerson,
  prompt,
  answer,
  href,
  sample,
  hidden,
}: {
  name: string;
  given: string;
  initials: string;
  credential: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  virtual: boolean;
  inPerson: boolean;
  prompt: string | null;
  answer: string | null;
  href: string;
  sample: boolean;
  hidden: boolean;
}) {
  const portrait = Boolean(photoUrl || videoUrl);
  const knowLabel = `Get to know ${given}`;
  const code = credential?.trim() || null;
  const formats = virtual || inPerson;

  return (
    <div data-find-card="phone" className="md:hidden">
      {videoUrl ? (
        <CardIntroVideo
          name={name}
          initials={initials}
          photoUrl={photoUrl}
          videoUrl={videoUrl}
        />
      ) : photoUrl ? (
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
          {/* Public Storage URLs; next/image is out of scope this weekend. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        </div>
      ) : null}

      <div className="px-5 pt-5 pb-5">
        <div className="flex items-start gap-3">
          {portrait ? null : (
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-clay font-display text-lg text-paper"
            >
              {initials}
            </span>
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="font-display text-[2rem] leading-none font-bold tracking-tight text-ink">
              {name}
            </h2>
            {sample ? (
              <span className="shrink-0 rounded-full bg-[#f3dc6b] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink">
                SAMPLE
              </span>
            ) : null}
          </div>
        </div>

        {code || formats ? (
          <div className="mt-2.5 flex items-center gap-3">
            {code ? <p className="text-sm text-mute">{code}</p> : null}
            {formats ? (
              <div
                data-find-formats
                className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5"
              >
                {virtual ? <FormatPill label="Virtual" /> : null}
                {inPerson ? <FormatPill label="In-Person" /> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {hidden ? <HiddenFromPublicBadge variant="card" /> : null}

        {prompt && answer ? (
          <div className="mt-5">
            <p className="font-display text-[1.15rem] leading-snug text-clay italic">
              {prompt}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{answer}</p>
          </div>
        ) : null}

        <Link
          href={href}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-center text-[15px] font-medium text-paper transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {knowLabel}
        </Link>
      </div>
    </div>
  );
}
