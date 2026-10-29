export function UploadedStatus({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-ink">
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden
      >
        <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </p>
  );
}
