import { Check } from "lucide-react";

import { Section } from "@/components/profile/section";
import { about } from "@/content/profile";

export function About() {
  return (
    <Section id="about" eyebrow="About" title="What I work on">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 text-lg leading-relaxed">
          {about.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            What I do
          </h3>
          <ul className="mt-4 space-y-4">
            {about.whatIDo.map((item) => (
              <li key={item} className="flex gap-3 leading-relaxed">
                <Check
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-10 text-sm font-medium text-muted-foreground">
            How I got here
          </h3>
          <p className="mt-4 leading-relaxed">{about.howIGotHere}</p>
        </div>
      </div>
    </Section>
  );
}
