import { TherapistStart } from "@/components/home/TherapistStart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pageTitleClass, sectionTitleClass } from "@/components/ui/styles";
import type { HomePanel } from "@/lib/home";

export function HomeHero({ client }: { client: HomePanel }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <Eyebrow className="text-center">Kitchen Sink</Eyebrow>
      <h1 className={`mx-auto mt-4 max-w-4xl text-center ${pageTitleClass}`}>
        <span className="sm:whitespace-nowrap">Bring everything. And the</span>
        <span className="block">kitchen sink.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-body sm:text-lg">
        Connect with a therapist you can bring everything — and the kitchen sink
        — to session.
      </p>

      <TherapistStart />

      <Card className="mx-auto mt-16 w-full max-w-2xl px-6 py-10 sm:px-12 sm:py-12">
        <h2 className={`text-center text-ink ${sectionTitleClass}`}>{client.title}</h2>
        {client.body ? (
          <p className="mx-auto mt-3 max-w-md text-center text-base text-body">
            {client.body}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {client.actions.map((action) => (
            <Button key={action.label} href={action.href} variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>
      </Card>
    </main>
  );
}
