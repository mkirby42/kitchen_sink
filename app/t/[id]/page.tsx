import type { Metadata } from "next";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Therapist ${id}` };
}

export default async function TherapistProfilePage({
  params,
}: ProfilePageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <p className="text-sm text-mute">Therapist profile</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{id}</h1>
      <p className="mt-4 text-mute">
        Photo, intro video, cards, rates, and reviews load here once the
        database is in.
      </p>
    </main>
  );
}
