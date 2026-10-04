import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { caseStudies } from "@/content/case-studies";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Work",
  description:
    "Case studies on agentic AI systems and quantitative research by Jitin Gupta.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-24">
      <p className="font-mono text-xs tracking-wider text-primary uppercase">
        Work
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Case studies
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        How I approach hard problems: the context, the design decisions and what
        I learned.
      </p>
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {caseStudies.map((study) => (
          <li key={study.slug}>
            <Link
              href={`/work/${study.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <p className="text-sm text-muted-foreground">
                {study.organisation} · {study.period}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {study.title}
              </h2>
              <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">
                {study.summary}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read case study
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
