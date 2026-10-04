import { notFound } from "next/navigation";

import { ArticleList } from "@/components/writing/article-list";
import { getArticles, getTags, tagSlug } from "@/content/writing";
import { buildMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ tag: string }> };

function tagFromSlug(slug: string) {
  return getTags().find((tag) => tagSlug(tag) === slug);
}

export function generateStaticParams() {
  return getTags().map((tag) => ({ tag: tagSlug(tag) }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const tag = tagFromSlug((await params).tag);
  if (!tag) return {};
  return buildMetadata({
    title: `Articles tagged “${tag}”`,
    path: `/writing/tags/${tagSlug(tag)}`,
  });
}

export default async function TagPage({ params }: Props) {
  const tag = tagFromSlug((await params).tag);
  if (!tag) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:py-24">
      <p className="font-mono text-xs tracking-wider text-primary uppercase">
        Writing
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Articles tagged “{tag}”
      </h1>
      <ArticleList
        articles={getArticles().filter((article) => article.tags.includes(tag))}
      />
    </main>
  );
}
