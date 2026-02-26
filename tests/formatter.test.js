import test from "node:test";
import assert from "node:assert/strict";

import { analyzeResume } from "../src/analyzer.js";
import { formatSummary } from "../src/formatter.js";

test("formatSummary includes high-signal sections", () => {
  const result = analyzeResume(
    "Experience Projects Education Skills JavaScript TypeScript React Node Testing",
    "fullstack"
  );
  const summary = formatSummary(result);

  assert.equal(summary.includes("Role: fullstack"), true);
  assert.equal(summary.includes("Overall Score:"), true);
  assert.equal(summary.includes("Suggestions:"), true);
});
