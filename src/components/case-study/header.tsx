import { Badge } from "@/components/ui/badge";
import type { CaseStudyMeta } from "@/content/case-studies";

export function CaseStudyHeader({ study }: { study: CaseStudyMeta }) {
  return (
    <header className="border-b border-border/60 pb-10">
      <p className="font-mono text-xs tracking-wider text-primary uppercase">
        Case study
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {study.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {study.summary}
      </p>
      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="mt-1 font-medium">{study.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Where</dt>
          <dd className="mt-1 font-medium">{study.organisation}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">When</dt>
          <dd className="mt-1 font-medium">{study.period}</dd>
        </div>
      </dl>
      <ul className="mt-6 flex flex-wrap gap-2">
        {study.tags.map((tag) => (
          <li key={tag}>
            <Badge variant="secondary" className="font-normal">
              {tag}
            </Badge>
          </li>
        ))}
      </ul>
    </header>
  );
}
