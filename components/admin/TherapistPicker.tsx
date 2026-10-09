import type { AdminTherapist } from "@/lib/admin/media";
import { Card } from "@/components/ui/Card";
import { tagClass } from "@/components/ui/styles";

function therapistMeta(therapist: AdminTherapist) {
  return (
    [therapist.credential, therapist.email].filter(Boolean).join(" · ") ||
    "No email on file"
  );
}

export function TherapistPicker({
  therapists,
  selectedId,
  onSelect,
}: {
  therapists: AdminTherapist[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="mt-4 overflow-hidden">
      {therapists.length === 0 ? (
        <p className="px-4 py-3 text-sm text-mute">No therapist matches that.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {therapists.map((therapist) => {
            const active = therapist.id === selectedId;
            return (
              <li key={therapist.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(therapist.id)}
                  className={`w-full px-4 py-3 text-left focus-visible:ring-2 focus-visible:ring-clay focus-visible:outline-none focus-visible:ring-inset ${
                    active ? "bg-lavender" : "hover:bg-cream"
                  }`}
                >
                  <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block font-semibold text-black">{therapist.name}</span>
                      <span className="mt-0.5 block text-sm text-mute">
                        {therapistMeta(therapist)}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2 sm:justify-end">
                      <span className={tagClass(Boolean(therapist.videoKey))}>
                        {therapist.videoKey ? "Intro video" : "No intro video"}
                      </span>
                      {therapist.openToNewClients ? null : (
                        <span className={tagClass(false)}>Not open to new clients</span>
                      )}
                      {therapist.listed ? null : (
                        <span className={tagClass(false)}>Hidden from Find</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
