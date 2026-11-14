import { Hammer } from "lucide-react";
import { PageHeader } from "./page-header";

interface Props {
  title: string;
  description: string;
  phase: number;
  scope: string;
}

/** Placeholder for screens that land in a later build phase. */
export function PhaseCard({ title, description, phase, scope }: Props) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="grid max-w-xl place-items-center gap-3 rounded-card border border-dashed border-line bg-panel/60 px-8 py-16 text-center">
        <Hammer className="size-6 text-accent" aria-hidden />
        <h2 className="text-lg font-medium">Arrives in build phase {phase}</h2>
        <p className="text-sm text-fg-muted">{scope}</p>
      </section>
    </>
  );
}
