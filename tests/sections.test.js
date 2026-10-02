import test from "node:test";
import assert from "node:assert/strict";

import { detectSections } from "../src/sections.js";
import { analyzeResume } from "../src/analyzer.js";

test("a section word inside a sentence does not count as a heading", () => {
  const { found } = detectSections("Experienced engineer with strong skills in testing and education tooling.");
  assert.equal(found.size, 0);
});

test("standard heading variants map to their section", () => {
  const { found } = detectSections(
    ["PROFESSIONAL EXPERIENCE", "Work History:", "Technical Skills", "## Personal Projects", "Education & Training"].join("\n")
  );
  assert.deepEqual([...found].sort(), ["education", "experience", "projects", "skills"]);
});

test("colon-labelled lines count as headings", () => {
  const { found } = detectSections("Skills: React, Node\nEducation: BSc Computer Science");
  assert.deepEqual([...found].sort(), ["education", "skills"]);
});

test("creative headings are flagged for renaming", () => {
  const result = analyzeResume(["WHERE I'VE MADE AN IMPACT", "- Shipped things", "Skills:", "React"].join("\n"), "frontend");
  assert.deepEqual(result.breakdown.sections.unrecognised, ["WHERE I'VE MADE AN IMPACT"]);
  assert.equal(result.suggestions.some((line) => line.startsWith("Rename headings")), true);
  assert.equal(result.breakdown.sections.missing.includes("experience"), true);
});
