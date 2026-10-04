import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { AgentWorkflow } from "@/components/diagrams/agent-workflow";
import { BacktestPipeline } from "@/components/diagrams/backtest-pipeline";

/** Maps Markdown elements in case studies to the site's typography. */
const components: MDXComponents = {
  AgentWorkflow,
  BacktestPipeline,
  h2: ({ children, ...props }) => (
    <h2
      className="mt-14 scroll-mt-20 text-2xl font-semibold tracking-tight first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-8 text-lg font-semibold tracking-tight" {...props}>
      {children}
    </h3>
  ),
  p: (props) => (
    <p className="mt-4 leading-relaxed text-foreground/90" {...props} />
  ),
  ul: (props) => (
    <ul
      className="mt-4 list-disc space-y-2 pl-5 leading-relaxed marker:text-muted-foreground"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed marker:text-muted-foreground"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  a: ({ href = "", ...props }) =>
    href.startsWith("/") ? (
      <Link
        href={href}
        className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        {...props}
      />
    ) : (
      <a
        href={href}
        className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        rel="noopener"
        target="_blank"
        {...props}
      />
    ),
  blockquote: (props) => (
    <blockquote
      className="mt-6 border-l-2 border-primary/60 pl-4 text-muted-foreground italic"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"
      {...props}
    />
  ),
  hr: () => <hr className="my-12 border-border" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
