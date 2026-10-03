import { siteConfig } from "@/config/site";

// Evaluated at build time, so it shows when the site was last deployed.
const lastUpdated = new Date().toLocaleDateString("en-GB", {
  month: "long",
  year: "numeric",
});

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {siteConfig.name} · Last updated {lastUpdated}
        </p>
        <ul className="flex gap-4">
          <li>
            <a
              href={siteConfig.linkedin}
              className="transition-colors hover:text-foreground"
              rel="me noopener"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href={`mailto:${siteConfig.email}`}
              className="transition-colors hover:text-foreground"
            >
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
