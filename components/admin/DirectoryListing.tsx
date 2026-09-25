export function DirectoryListing({
  listed,
  busy,
  disabled,
  onToggle,
}: {
  listed: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3">
      <p className="text-sm">{listed ? "Shown on Find" : "Hidden from Find"}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="text-sm font-medium text-clay hover:text-clay-dark disabled:opacity-50"
      >
        {busy ? "Saving…" : listed ? "Hide from Find" : "Show on Find"}
      </button>
    </div>
  );
}
