import test from "node:test";
import assert from "node:assert/strict";

import { analyzeResume } from "../src/analyzer.js";

test("keyword-rich resume scores higher than sparse resume", () => {
  const strong = analyzeResume(
    "Skills JavaScript TypeScript React Node SQL Testing Docker Experience Projects Education",
    "fullstack"
  );
  const weak = analyzeResume("I am motivated and hardworking", "fullstack");

  assert.equal(strong.score > weak.score, true);
});

test("missing sections generate suggestions", () => {
  const result = analyzeResume("Skills JavaScript TypeScript", "frontend");
  assert.equal(result.suggestions.some((line) => line.includes("missing sections")), true);
});

test("readability penalizes very short resumes", () => {
  const shortResult = analyzeResume("skills react", "frontend");
  assert.equal(shortResult.breakdown.readability.score < 50, true);
});

test("analysis includes transparent breakdown keys", () => {
  const result = analyzeResume("Experience Projects Education Skills Python SQL", "data");
  assert.equal(typeof result.breakdown.keywords.score, "number");
  assert.equal(Array.isArray(result.breakdown.keywords.hits), true);
  assert.equal(Array.isArray(result.breakdown.sections.present), true);
});

test("role fallback defaults to fullstack when role is unknown", () => {
  const result = analyzeResume("Experience Projects Education Skills JavaScript", "unknown-role");
  assert.equal(result.role, "fullstack");
});

test("quantified bullet achievements improve achievement score", () => {
  const quantified = analyzeResume(
    [
      "Experience",
      "Projects",
      "Education",
      "Skills",
      "- Improved conversion by 22% across product pages",
      "- Reduced API latency by 180ms"
    ].join("\n"),
    "fullstack"
  );
  const plain = analyzeResume(
    [
      "Experience",
      "Projects",
      "Education",
      "Skills",
      "- Improved product quality and collaboration",
      "- Worked on backend services"
    ].join("\n"),
    "fullstack"
  );

  assert.equal(quantified.breakdown.achievements.score > plain.breakdown.achievements.score, true);
});
