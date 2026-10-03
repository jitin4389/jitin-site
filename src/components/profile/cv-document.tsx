import { siteConfig } from "@/config/site";
import {
  certifications,
  cvSummary,
  earlierExperience,
  education,
  experience,
  hero,
  skillGroups,
  training,
} from "@/content/profile";
import { formatMonth, formatRange } from "@/lib/dates";

function CvHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-5 border-b border-border pb-1 text-[10.5px] font-semibold tracking-[0.12em] text-primary uppercase">
      {children}
    </h2>
  );
}

/**
 * The CV as an A4 document. Rendered on /cv and printed to the PDF.
 * Always light (theme-light) and compact so it fits on two pages.
 */
export function CvDocument() {
  const linkedinLabel = siteConfig.linkedin
    .replace(/^https:\/\/(www\.)?/, "")
    .replace(/\/$/, "");

  return (
    <article className="theme-light mx-auto w-full max-w-[210mm] bg-background px-[14mm] py-[12mm] text-[10px] leading-[1.45] text-foreground shadow-sm ring-1 ring-border print:max-w-none print:bg-white print:p-0 print:shadow-none print:ring-0">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {hero.name}
        </h1>
        <p className="mt-0.5 text-[12px] font-medium text-primary">
          {hero.role}
        </p>
        <p className="mt-1 text-muted-foreground">
          {hero.location} ·{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> ·{" "}
          <a href={siteConfig.linkedin}>{linkedinLabel}</a> ·{" "}
          <a href={siteConfig.url}>{siteConfig.url.replace("https://", "")}</a>
        </p>
      </header>

      <section>
        <CvHeading>Summary</CvHeading>
        <div className="mt-2 space-y-1.5">
          {cvSummary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section>
        <CvHeading>Core capabilities</CvHeading>
        <dl className="mt-2 space-y-1">
          {skillGroups.map((group) => (
            <div key={group.name}>
              <dt className="inline font-semibold">{group.name}: </dt>
              <dd className="inline text-muted-foreground">
                {group.skills.join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <CvHeading>Experience</CvHeading>
        <div className="mt-2 space-y-3">
          {experience.map((entry) => (
            <div key={entry.company} className="break-inside-avoid-page">
              <p className="flex justify-between gap-4">
                <span className="text-[11px] font-semibold">
                  {entry.company}
                </span>
                <span className="text-muted-foreground">{entry.location}</span>
              </p>
              {entry.roles.map((role) => (
                <div key={`${role.title}-${role.start}`} className="mt-1">
                  <p className="flex justify-between gap-4">
                    <span className="font-medium">{role.title}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatRange(role.start, role.end)}
                    </span>
                  </p>
                  {role.summary && <p className="mt-0.5">{role.summary}</p>}
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                    {role.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 break-inside-avoid-page">
          <p className="font-semibold">Earlier roles</p>
          <ul className="mt-0.5 space-y-0.5">
            {earlierExperience.flatMap((entry) =>
              entry.roles.map((role) => (
                <li
                  key={`${entry.company}-${role.title}`}
                  className="flex justify-between gap-4"
                >
                  <span>
                    {role.title}, {entry.company}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatRange(role.start, role.end)}
                  </span>
                </li>
              )),
            )}
          </ul>
        </div>
      </section>

      <section className="break-inside-avoid-page">
        <CvHeading>Education & certifications</CvHeading>
        <ul className="mt-2 space-y-0.5">
          {education.map((item) => (
            <li key={item.institution}>
              <span className="font-medium">{item.institution}</span>,{" "}
              {item.degree} ({item.years})
            </li>
          ))}
          {certifications.map((cert) => (
            <li key={cert.name}>
              <span className="font-medium">{cert.name}</span>, {cert.issuer} (
              {cert.status === "current"
                ? `${formatMonth(cert.issued)}, valid to ${formatMonth(cert.expires ?? cert.issued)}`
                : `${cert.issued.slice(0, 4)}–${cert.expires?.slice(0, 4)}, expired`}
              )
            </li>
          ))}
          {training.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
