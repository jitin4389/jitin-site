import Link from "next/link";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { getEnabledNav, siteConfig } from "@/config/site";

export function SiteHeader() {
  const items = getEnabledNav();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4"
      >
        <Link href="/" className="font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <ul className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground focus-visible:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
