import test from "node:test";
import assert from "node:assert/strict";

import { analyzeResume } from "../src/analyzer.js";

test("spelling variants count toward the canonical keyword", () => {
  const result = analyzeResume("Built ReactJS front ends on Node.js with PostgreSQL", "fullstack");
  const { hits, viaAlias } = result.breakdown.keywords;
  assert.equal(hits.includes("react"), true);
  assert.equal(hits.includes("node"), true);
  assert.equal(hits.includes("sql"), true);
  assert.equal(viaAlias.sql, "postgresql");
  assert.equal("node" in viaAlias, false);
});

test("multi-word aliases match only as a phrase", () => {
  const phrase = analyzeResume("Applied machine learning to churn", "data");
  const scattered = analyzeResume("Machine shop work and learning Excel", "data");
  assert.equal(phrase.breakdown.keywords.hits.includes("ml"), true);
  assert.equal(scattered.breakdown.keywords.hits.includes("ml"), false);
});

test("alias-only matches produce an exact-term suggestion", () => {
  const result = analyzeResume("Wrote Jest suites", "frontend");
  assert.equal(result.suggestions.some((line) => line.includes('testing (found as "jest")')), true);
});
