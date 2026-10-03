import { ArrowUpRight, Mail } from "lucide-react";

import { Section } from "@/components/profile/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Get in touch">
      <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          The best way to reach me is by email or on LinkedIn.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={`mailto:${siteConfig.email}`}>
              <Mail aria-hidden="true" />
              {siteConfig.email}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={siteConfig.linkedin} rel="me noopener" target="_blank">
              LinkedIn
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </Section>
  );
}
