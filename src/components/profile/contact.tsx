import { ArrowUpRight, Download, Mail } from "lucide-react";

import { ContactForm } from "@/components/profile/contact-form";
import { Section } from "@/components/profile/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Get in touch">
      <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Send a message with the form, or reach me directly by email or on
            LinkedIn.
          </p>
          <div className="mt-6 flex flex-col items-start gap-2">
            <Button
              asChild
              variant="ghost"
              className="px-0 hover:bg-transparent"
            >
              <a href={`mailto:${siteConfig.email}`}>
                <Mail aria-hidden="true" />
                {siteConfig.email}
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="px-0 hover:bg-transparent"
            >
              <a href={siteConfig.linkedin} rel="me noopener" target="_blank">
                <ArrowUpRight aria-hidden="true" />
                LinkedIn
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="px-0 hover:bg-transparent"
            >
              <a href={siteConfig.cvPdf} download>
                <Download aria-hidden="true" />
                Download CV (PDF)
              </a>
            </Button>
          </div>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
