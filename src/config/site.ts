export type NavItem = {
  label: string;
  href: string;
  /** Hidden until the module that owns the page ships. */
  enabled: boolean;
};

export const siteConfig = {
  name: "Jitin Gupta",
  role: "Applied AI Architect",
  description:
    "Applied AI Architect: agentic AI systems and quantitative forecasting.",
  url: "https://jitin-site.vercel.app",
  email: "jitin4389@gmail.com",
  linkedin: "https://www.linkedin.com/in/jitin-gupta-20395421/",
  nav: [
    { label: "Home", href: "/", enabled: true },
    { label: "Work", href: "/work", enabled: false },
    { label: "Writing", href: "/writing", enabled: false },
    { label: "Contact", href: "/contact", enabled: false },
  ] satisfies NavItem[],
};

export function getEnabledNav(items: NavItem[] = siteConfig.nav): NavItem[] {
  return items.filter((item) => item.enabled);
}
