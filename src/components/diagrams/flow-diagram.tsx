import { ArrowDown, RotateCcw } from "lucide-react";
import { Fragment } from "react";

export type FlowStep = { title: string; detail: string };

type FlowDiagramProps = {
  caption: string;
  steps: FlowStep[];
  /** Optional feedback loop shown under the steps, e.g. "Evaluate → revise". */
  loop?: string;
  /** Optional cross-cutting concern shown as a band under the flow. */
  lane?: FlowStep;
};

/**
 * A responsive, theme-aware flow diagram built from an ordered list, so screen readers
 * read the steps in order. Steps stack vertically; on wider screens each step is a single row.
 */
export function FlowDiagram({ caption, steps, loop, lane }: FlowDiagramProps) {
  return (
    <figure className="not-prose my-10 rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
      <ol className="flex flex-col gap-1.5">
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            <li className="rounded-xl border border-border bg-background p-3 sm:grid sm:grid-cols-[2.5rem_11rem_1fr] sm:items-baseline sm:gap-3">
              <p className="font-mono text-[11px] text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-medium sm:mt-0">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-0 sm:text-sm">
                {step.detail}
              </p>
            </li>
            {index < steps.length - 1 && (
              <li
                aria-hidden="true"
                className="flex justify-center text-muted-foreground sm:justify-start sm:pl-3"
              >
                <ArrowDown className="size-3.5" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
      {loop && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <RotateCcw aria-hidden="true" className="size-3.5 text-primary" />
          {loop}
        </p>
      )}
      {lane && (
        <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-accent/30 p-3">
          <p className="text-sm font-medium">{lane.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {lane.detail}
          </p>
        </div>
      )}
      <figcaption className="mt-4 text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
