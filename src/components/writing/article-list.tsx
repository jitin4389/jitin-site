import Link from "next/link";

import { ArticleMeta } from "@/components/writing/article-meta";
import type { Article } from "@/content/writing";
import { readingMinutesForArticle } from "@/lib/reading-time";

export function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <ul className="mt-12 divide-y divide-border/60 border-y border-border/60">
      {articles.map((article) => (
        <li key={article.slug} className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            <Link
              href={`/writing/${article.slug}`}
              className="hover:text-primary"
            >
              {article.title}
            </Link>
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
            {article.description}
          </p>
          <div className="mt-4">
            <ArticleMeta
              article={article}
              minutes={readingMinutesForArticle(article.slug)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
