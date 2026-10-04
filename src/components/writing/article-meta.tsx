import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { tagSlug, type Article } from "@/content/writing";
import { formatDay } from "@/lib/dates";

export function ArticleMeta({
  article,
  minutes,
}: {
  article: Article;
  minutes: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <time dateTime={article.date}>{formatDay(article.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{minutes} min read</span>
      {article.series && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Part {article.series.part} of {article.series.of}
          </span>
        </>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Tags">
        {article.tags.map((tag) => (
          <li key={tag}>
            <Badge asChild variant="secondary" className="font-normal">
              <Link href={`/writing/tags/${tagSlug(tag)}`}>{tag}</Link>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
