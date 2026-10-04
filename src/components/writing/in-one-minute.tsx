import { Timer } from "lucide-react";

import type { Article } from "@/content/writing";

export function InOneMinute({ article }: { article: Article }) {
  return (
    <aside
      aria-labelledby="in-one-minute"
      className="mt-10 rounded-2xl border border-primary/30 bg-accent/30 p-5 sm:p-6"
    >
      <h2
        id="in-one-minute"
        className="flex items-center gap-2 text-base font-semibold"
      >
        <Timer aria-hidden="true" className="size-4 text-primary" />
        In one minute
      </h2>
      <p className="mt-3 leading-relaxed">{article.summary}</p>
      {article.keyTerms.length > 0 && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {article.keyTerms.map(({ term, definition }) => (
            <div key={term}>
              <dt className="font-medium">{term}</dt>
              <dd className="text-muted-foreground">{definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}
