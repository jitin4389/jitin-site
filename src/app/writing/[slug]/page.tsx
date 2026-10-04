import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleMeta } from "@/components/writing/article-meta";
import { InOneMinute } from "@/components/writing/in-one-minute";
import { SeriesNav } from "@/components/writing/series-nav";
import { articles, getArticle } from "@/content/writing";
import { buildMetadata } from "@/lib/metadata";
import { readingMinutesForArticle } from "@/lib/reading-time";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: `/writing/${article.slug}`,
  });
}

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const { default: Body } = await import(
    `@/content/writing/${article.slug}.md`
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:py-24">
      <Link
        href="/writing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All writing
      </Link>
      <article className="mt-8">
        <header>
          {article.series && (
            <p className="font-mono text-xs tracking-wider text-primary uppercase">
              {article.series.name}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {article.description}
          </p>
          <div className="mt-6">
            <ArticleMeta
              article={article}
              minutes={readingMinutesForArticle(article.slug)}
            />
          </div>
        </header>
        <InOneMinute article={article} />
        <div className="mt-12 [overflow-wrap:anywhere]">
          <Body />
        </div>
        {article.keyPoints.length > 0 && (
          <section
            aria-labelledby="key-points"
            className="mt-14 border-t border-border/60 pt-8"
          >
            <h2 id="key-points" className="text-lg font-semibold">
              Key points
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              {article.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <SeriesNav slug={article.slug} />
    </main>
  );
}
