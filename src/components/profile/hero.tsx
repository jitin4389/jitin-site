import { ArrowUpRight, Download, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { hero } from "@/content/profile";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate">
      {/* Decorative: indigo glow and a faint grid fading out from the top. */}
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto max-w-5xl px-4 pt-20 pb-8 sm:pt-32 sm:pb-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-primary"
          />
          {hero.role} · {hero.location}
        </p>
        <h1
          id="hero-heading"
          className="mt-6 text-5xl font-semibold tracking-tighter text-balance sm:text-6xl"
        >
          {hero.name}
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-balance text-muted-foreground sm:text-2xl">
          {hero.statement}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">{hero.focus}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={siteConfig.cvPdf} download>
              <Download aria-hidden="true" />
              Download CV
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`mailto:${siteConfig.email}`}>
              <Mail aria-hidden="true" />
              Email me
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={siteConfig.linkedin} rel="me noopener" target="_blank">
              LinkedIn
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
