import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { getSeriesNeighbours } from "@/content/writing";

export function SeriesNav({ slug }: { slug: string }) {
  const { previous, next } = getSeriesNeighbours(slug);
  if (!previous && !next) return null;
  return (
    <nav aria-label="Series" className="mt-12 grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Link
          href={`/writing/${previous.slug}`}
          className="rounded-xl border border-border p-4 hover:border-primary/40"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft aria-hidden="true" className="size-3.5" /> Previous part
          </span>
          <span className="mt-1 block font-medium">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={`/writing/${next.slug}`}
          className="rounded-xl border border-border p-4 text-right hover:border-primary/40"
        >
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next part <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
          <span className="mt-1 block font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
