import { Rss } from "lucide-react";

import { ArticleList } from "@/components/writing/article-list";
import { getArticles } from "@/content/writing";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Writing",
  description:
    "Practical guides on agentic coding, AI systems and quantitative research by Jitin Gupta.",
  path: "/writing",
});

export default function WritingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:py-24">
      <p className="font-mono text-xs tracking-wider text-primary uppercase">
        Writing
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Articles
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Practical guides from building agentic AI systems in production.{" "}
        <a
          href="/rss.xml"
          className="inline-flex items-center gap-1 text-primary underline decoration-primary/40 underline-offset-4"
        >
          <Rss aria-hidden="true" className="size-4" />
          RSS
        </a>
      </p>
      <ArticleList articles={getArticles()} />
    </main>
  );
}
