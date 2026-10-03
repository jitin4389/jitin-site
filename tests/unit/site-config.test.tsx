import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/site/site-header";
import { getEnabledNav, siteConfig, type NavItem } from "@/config/site";

describe("getEnabledNav", () => {
  it("keeps only enabled items, in order", () => {
    const items: NavItem[] = [
      { label: "A", href: "/a", enabled: true },
      { label: "B", href: "/b", enabled: false },
      { label: "C", href: "/c", enabled: true },
    ];
    expect(getEnabledNav(items).map((item) => item.label)).toEqual(["A", "C"]);
  });
});

describe("SiteHeader", () => {
  it("renders a link for every enabled nav item and none for disabled ones", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    for (const item of siteConfig.nav) {
      const link = within(nav).queryByRole("link", { name: item.label });
      if (item.enabled) expect(link).toHaveAttribute("href", item.href);
      else expect(link).toBeNull();
    }
  });
});
