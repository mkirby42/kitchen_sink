export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-full bg-line p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={
              selected
                ? "rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper"
                : "rounded-full px-3 py-1 text-xs font-medium text-ink/65 hover:text-ink"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
