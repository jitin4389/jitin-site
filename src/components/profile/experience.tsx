import { ChevronRight } from "lucide-react";

import { Section } from "@/components/profile/section";
import { Badge } from "@/components/ui/badge";
import {
  earlierExperience,
  experience,
  type ExperienceEntry,
} from "@/content/profile";
import { formatRange } from "@/lib/dates";

function CompanyHeader({ entry }: { entry: ExperienceEntry }) {
  const meta = [entry.location, entry.type].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="text-lg font-semibold tracking-tight">{entry.company}</h3>
      {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
    </div>
  );
}

function Timeline({ entry }: { entry: ExperienceEntry }) {
  return (
    <ol className="mt-4 space-y-8 border-l border-border pl-6">
      {entry.roles.map((role) => (
        <li key={`${role.title}-${role.start}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-2 -left-[29px] size-2.5 rounded-full border-2 border-background bg-primary"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="font-medium">{role.title}</h4>
            {role.badge && <Badge variant="secondary">{role.badge}</Badge>}
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {formatRange(role.start, role.end)}
          </p>
          {role.summary && (
            <p className="mt-3 leading-relaxed">{role.summary}</p>
          )}
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-border">
            {role.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function Experience() {
  return (
    <Section id="experience" eyebrow="Experience" title="Where I've worked">
      <div className="space-y-12">
        {experience.map((entry) => (
          <article key={entry.company}>
            <CompanyHeader entry={entry} />
            <Timeline entry={entry} />
          </article>
        ))}
      </div>

      <details className="group mt-12 rounded-xl border border-border bg-card/40 p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
          />
          Earlier roles (2014 – 2024)
        </summary>
        <ul className="mt-5 space-y-4">
          {earlierExperience.flatMap((entry) =>
            entry.roles.map((role) => (
              <li
                key={`${entry.company}-${role.title}`}
                className="grid gap-1 sm:grid-cols-[1fr_auto]"
              >
                <p>
                  <span className="font-medium">{role.title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {entry.company}
                  </span>
                </p>
                <p className="font-mono text-xs text-muted-foreground sm:text-right">
                  {formatRange(role.start, role.end)}
                </p>
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  {role.highlights[0]}
                </p>
              </li>
            )),
          )}
        </ul>
      </details>
    </Section>
  );
}
