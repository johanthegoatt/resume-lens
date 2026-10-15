import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cli = (...args) => spawnSync(process.execPath, ["src/cli.js", ...args], { encoding: "utf8" });

test("an unknown role is an error that lists the real ones", () => {
  const run = cli("data/sample-resume.txt", "designer");
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Unknown role "designer"\. Choose one of: fullstack, data, frontend/);
});

test("roles are case-insensitive", () => {
  const run = cli("--input", "data/sample-resume.txt", "--role", "Data", "--format", "summary");
  assert.equal(run.status, 0);
  assert.match(run.stdout, /^Role: data/m);
});
