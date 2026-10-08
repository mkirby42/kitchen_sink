import { Button } from "@/components/ui/Button";
import { tagClass } from "@/components/ui/styles";

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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className={tagClass(listed)}>
        {listed ? "Shown on Find" : "Hidden from Find"}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={onToggle}
      >
        {busy ? "Saving…" : listed ? "Hide from Find" : "Show on Find"}
      </Button>
    </div>
  );
}
