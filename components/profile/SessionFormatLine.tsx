import { metaLineClass } from "@/components/ui/styles";

export function SessionFormatLine({ formats }: { formats: string[] }) {
  if (formats.length === 0) return null;

  return (
    <p
      data-session-format
      className={`inline-flex flex-wrap items-center gap-x-1.5 ${metaLineClass}`}
    >
      {formats.map((label, index) => (
        <span key={label} className="inline-flex items-center gap-x-1.5">
          {index > 0 ? <span aria-hidden>·</span> : null}
          <span className="inline-flex items-center gap-1">
            {label === "In person" ? <PinIcon /> : <VideoIcon />}
            <span>{label}</span>
          </span>
        </span>
      ))}
    </p>
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
