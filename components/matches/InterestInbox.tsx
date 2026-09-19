import { formatInterestDate } from "@/lib/interest/format";
import type { InterestInboxRow } from "@/lib/interest/viewer";

function peopleLabel(count: number) {
  return count === 1 ? "1 person" : `${count} people`;
}

export function InterestInbox({ rows }: { rows: InterestInboxRow[] }) {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Interest
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        People interested in working with you
      </h1>
      <p className="mt-3 text-mute">
        {rows.length > 0 ? `${peopleLabel(rows.length)}. ` : null}
        They stay anonymous here. They can still email or call you from your
        profile.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-line bg-paper px-6 py-10 text-center text-mute">
          No one has tapped I&apos;m interested yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-3xl border border-line bg-paper p-6"
            >
              <p className="font-display text-xl tracking-tight text-ink">
                {row.alias}
              </p>
              <p className="mt-1 text-sm text-mute">
                Expressed interest {formatInterestDate(row.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
