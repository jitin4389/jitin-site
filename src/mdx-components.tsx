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
  ul: ({ className, ...props }) => (
    <ul
      className={
        className?.includes("contains-task-list")
          ? "mt-4 list-none space-y-2 pl-0 leading-relaxed"
          : "mt-4 list-disc space-y-2 pl-5 leading-relaxed marker:text-muted-foreground"
      }
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
  // Scrollable regions must be keyboard-focusable (tabIndex 0) for accessibility.
  pre: (props) => (
    <pre
      tabIndex={0}
      className="mt-6 overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.95em]"
      {...props}
    />
  ),
  table: (props) => (
    <div
      tabIndex={0}
      className="mt-6 overflow-x-auto rounded-xl border border-border"
    >
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  // Tables scroll inside their wrapper, so cells keep normal word wrapping even where the article body
  // allows breaking anywhere (that rule exists for long URLs at 360 px, not for table text).
  th: (props) => (
    <th
      className="border-b border-border bg-muted/50 px-3 py-2 font-medium [overflow-wrap:normal] whitespace-nowrap"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="min-w-[9rem] border-b border-border/60 px-3 py-2 align-top [overflow-wrap:normal]"
      {...props}
    />
  ),
  // GFM task lists ("- [ ]") render as decorative boxes: readers can't tick them on the page,
  // and unlabelled disabled checkboxes fail accessibility checks.
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <span
        aria-hidden="true"
        className={`mr-2 inline-block size-3.5 translate-y-0.5 rounded-[3px] border border-muted-foreground/60 ${checked ? "bg-primary" : ""}`}
      />
    ) : null,
  hr: () => <hr className="my-12 border-border" />,
  // Article slides: `![alt](/writing/<slug>/<n>.svg "Caption")`. Self-contained 16:9 SVGs, so a plain
  // <img> is right (no optimisation pass, no theme dependence); explicit dimensions avoid layout shift.
  // The figure links to the file so phone readers can open it full size and zoom.
  img: ({ src, alt, title }) => (
    <figure className="mt-8">
      <a
        href={src}
        target="_blank"
        rel="noopener"
        aria-label="Open the slide full size"
        className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-xl border border-border"
        />
      </a>
      {title && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {title}
        </figcaption>
      )}
    </figure>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
