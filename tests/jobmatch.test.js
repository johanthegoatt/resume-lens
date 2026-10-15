import test from "node:test";
import assert from "node:assert/strict";

import { bm25Saturation, jobMatch } from "../src/jobmatch.js";
import { analyzeResume } from "../src/analyzer.js";
import { formatSummary } from "../src/formatter.js";

test("tf saturation flattens repeated terms", () => {
  assert.equal(bm25Saturation(1), 1);
  assert.equal(bm25Saturation(10) < 2.2, true);
  assert.equal(bm25Saturation(10) > bm25Saturation(2), true);
});

test("named skills outrank filler words", () => {
  const result = jobMatch("", "Maintain the dashboard. Kafka pipelines.");
  assert.equal(result.missing[0], "kafka");
});

test("job match reports covered and missing terms", () => {
  const result = jobMatch("Built React and Node.js services", "React. Node. Kafka. Kafka consumers.");
  assert.deepEqual(result.missing.slice(0, 2), ["kafka", "consumers"]);
  assert.equal(result.matched.includes("react"), true);
  assert.equal(result.matched.includes("node"), true);
  assert.equal(result.score > 0 && result.score < 100, true);
});

test("spelling variants bridge resume and job wording", () => {
  const result = jobMatch("PostgreSQL migrations on Node.js", "Own Postgres schema in NodeJS");
  assert.deepEqual(result.matched.sort(), ["node", "postgresql"]);
});

test("a related skill does not satisfy a named one", () => {
  const result = jobMatch("Docker images", "Kubernetes clusters");
  assert.equal(result.missing.includes("kubernetes"), true);
});

test("analyzeResume carries job match into suggestions and summary", () => {
  const result = analyzeResume("Skills:\nReact", "frontend", { jobDescription: "React and Kafka" });
  assert.equal(result.jobMatch.missing.includes("kafka"), true);
  assert.equal(result.suggestions[0].includes("kafka"), true);
  assert.equal(formatSummary(result).includes("Job Match:"), true);
  assert.equal(analyzeResume("React", "frontend").jobMatch, null);
});

test("C++, C# and .NET survive tokenising and Node.js is not a JavaScript requirement", () => {
  const cpp = jobMatch("Skills: C, Java", "Must know C++ and C#. .NET a plus.");
  assert.deepEqual(cpp.matched, []);
  assert.deepEqual(cpp.missing.slice(0, 3).sort(), ["cplusplus", "csharp", "dotnet"]);

  const node = jobMatch("Skills: JavaScript", "We need Node.js developers");
  assert.equal(node.matched.includes("javascript"), false);
  assert.equal(node.missing.includes("node"), true);
  assert.equal(node.missing.includes("developers"), false);

  const ok = jobMatch("Built services in C# on ASP.NET and Node.js", "C#, ASP.NET, NodeJS");
  assert.equal(ok.score, 100);
});
