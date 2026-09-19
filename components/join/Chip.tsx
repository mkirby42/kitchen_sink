"use client";

export function Chip({
  selected,
  onClick,
  disabled = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={
        selected
          ? "rounded-full bg-clay px-4 py-2 text-sm font-medium text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
          : "rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}
