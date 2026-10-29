/**
 * Portrait of the uploaded profile photo. Sits below How {name} works.
 * object-position keeps the same face crop the hero used to use.
 */
export function ProfilePhoto({ name, src }: { name: string; src: string }) {
  return (
    <figure data-profile-photo className="mt-10">
      {/* Public Storage URLs; next/image is out of scope. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Photo of ${name}`}
        className="mx-auto aspect-[4/5] w-full max-w-md rounded-[1.75rem] object-cover object-[center_18%] shadow-card"
      />
    </figure>
  );
}
