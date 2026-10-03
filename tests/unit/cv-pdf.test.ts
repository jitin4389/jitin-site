import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("generated CV PDF", () => {
  it("exists in public/", () => {
    expect(existsSync("public/jitin-gupta-cv.pdf")).toBe(true);
  });

  it("was generated from the current profile content (run `npm run cv:pdf` if this fails)", () => {
    const current = createHash("sha256")
      .update(readFileSync("src/content/profile.ts"))
      .digest("hex");
    const recorded = readFileSync("src/content/cv-pdf.sha256", "utf8").trim();
    expect(recorded).toBe(current);
  });
});
