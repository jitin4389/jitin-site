import { ArrowUpRight, BadgeCheck, GraduationCap } from "lucide-react";

import { Section } from "@/components/profile/section";
import { Badge } from "@/components/ui/badge";
import { certifications, education, skillGroups } from "@/content/profile";
import { formatMonth } from "@/lib/dates";

export function Skills() {
  const current = certifications.filter((cert) => cert.status === "current");
  const past = certifications.filter((cert) => cert.status === "past");

  return (
    <Section id="skills" eyebrow="Skills" title="Capabilities & credentials">
      <div className="grid gap-4 sm:grid-cols-2">
        {skillGroups.map((group) => (
          <div
            key={group.name}
            className="rounded-xl border border-border bg-card/40 p-5"
          >
            <h3 className="font-medium">{group.name}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="secondary" className="font-normal">
                    {skill}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {current.map((cert) => (
          <div
            key={cert.name}
            className="rounded-xl border border-primary/30 bg-accent/40 p-5"
          >
            <div className="flex items-start gap-3">
              <BadgeCheck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <h3 className="font-medium">{cert.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cert.issuer} · {formatMonth(cert.issued)}
                  {cert.expires && ` · valid to ${formatMonth(cert.expires)}`}
                </p>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Verify credential
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          {education.map((item) => (
            <div key={item.institution} className="flex items-start gap-3">
              <GraduationCap
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
              <div>
                <h3 className="font-medium">{item.institution}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.degree} · {item.years}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Past certifications:
          </span>{" "}
          {past
            .map(
              (cert) =>
                `${cert.name} (${cert.issued.slice(0, 4)}–${cert.expires?.slice(0, 4)})`,
            )
            .join(", ")}
        </p>
      )}
    </Section>
  );
}
