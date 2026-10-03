import { describe, expect, it } from "vitest";

import * as profile from "@/content/profile";

// Everything a visitor could read, as one string.
const allText = JSON.stringify(profile);
const allEntries = [...profile.experience, ...profile.earlierExperience];

describe("profile facts guard", () => {
  it.each([
    ["current title", "Applied AI Architect"],
    ["pre-promotion title", "Senior Software Engineer – Applied AI"],
    ["hedge fund size", "~$1B AUM"],
    ["model portfolio", "12+ sector forecasting models"],
    ["team size", "15+ person"],
    ["Vidyamandir MAPE", "~2% MAPE"],
    ["Vidyamandir dropout result", "20%"],
    ["education", "Indian Institute of Technology Delhi"],
  ])("includes the approved %s", (_label, claim) => {
    expect(allText).toContain(claim);
  });

  it.each([
    ["a phone number", /\d{10}/],
    ["the old Woolf degree", /Woolf/i],
    ["the unused 'Product & AI Lead' title", /Product & AI Lead/],
    ["claims of investment returns", /\b(alpha|returns of|outperform)/i],
  ])("never contains %s", (_label, pattern) => {
    expect(allText).not.toMatch(pattern);
  });

  it("dates CLOUDSUFI roles exactly as approved", () => {
    const [architect, engineer] = profile.experience[0].roles;
    expect(profile.experience[0].company).toBe("CLOUDSUFI");
    expect(architect).toMatchObject({
      title: "Applied AI Architect",
      start: "2025-07",
    });
    expect(architect.end).toBeUndefined();
    expect(engineer).toMatchObject({ start: "2024-10", end: "2025-06" });
  });

  it("marks the Databricks certification as past, never current", () => {
    const databricks = profile.certifications.find(
      (c) => c.issuer === "Databricks",
    );
    expect(databricks?.status).toBe("past");
  });

  it("lists every company's roles, and the companies, most recent first", () => {
    for (const list of [profile.experience, profile.earlierExperience]) {
      const latestStarts = list.map((entry) => entry.roles[0].start);
      expect(latestStarts).toEqual([...latestStarts].sort().reverse());
    }
    for (const entry of allEntries) {
      const starts = entry.roles.map((role) => role.start);
      expect(starts).toEqual([...starts].sort().reverse());
    }
  });

  it("uses well-formed YYYY-MM dates with end after start", () => {
    for (const role of allEntries.flatMap((entry) => entry.roles)) {
      expect(role.start).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      if (role.end) expect(role.end >= role.start).toBe(true);
    }
  });
});
