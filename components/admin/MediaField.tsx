import { PHOTO_ACCEPT, VIDEO_ACCEPT } from "@/lib/join/media";

export function MediaField({
  kind,
  uploaded,
  preview,
  busy,
  disabled,
  onFile,
}: {
  kind: "photo" | "video";
  uploaded: boolean;
  preview: string | null;
  busy: boolean;
  disabled: boolean;
  onFile: (file?: File) => void;
}) {
  const noun = kind === "photo" ? "photo" : "video";
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-cream text-clay">
        {preview && kind === "photo" ? (
          // Storage URLs are not configured for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : preview && kind === "video" ? (
          <video src={preview} muted playsInline className="size-full object-cover" />
        ) : (
          <span aria-hidden>{kind === "photo" ? "+" : "▶"}</span>
        )}
      </div>
      <div>
        <label className="inline-flex cursor-pointer rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20">
          {busy ? `Uploading ${noun}…` : uploaded ? `Replace ${noun}…` : `Choose a ${noun}…`}
          <input
            type="file"
            accept={kind === "photo" ? PHOTO_ACCEPT : VIDEO_ACCEPT}
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <p className="mt-2 text-sm text-mute">
          {uploaded
            ? `${kind === "photo" ? "Photo" : "Video"} on the profile.`
            : `No ${noun} on the profile yet.`}
          {kind === "photo"
            ? " JPEG, PNG, WebP, or GIF · up to 5MB."
            : " MP4, WebM, or MOV · up to 50MB."}
        </p>
      </div>
    </div>
  );
}
