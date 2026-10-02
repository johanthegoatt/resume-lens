import test from "node:test";
import assert from "node:assert/strict";

import { scoreBullet, achievementSignal } from "../src/bullets.js";

test("a full X-Y-Z bullet scores 1", () => {
  const bullet = scoreBullet("- Cut p95 latency by 40% by moving session reads to Redis");
  assert.deepEqual([bullet.x, bullet.y, bullet.z], [true, true, true]);
  assert.equal(bullet.score, 1);
});

test("duty phrases do not count as an action verb", () => {
  assert.equal(scoreBullet("- Responsible for 3 microservices").x, false);
  assert.equal(scoreBullet("- Worked on the billing API").x, false);
  assert.equal(scoreBullet("- Built the billing API").x, true);
});

test("the opening verb is not mistaken for a method clause", () => {
  assert.equal(scoreBullet("- Improved onboarding").z, false);
  assert.equal(scoreBullet("- Improved onboarding using guided tours").z, true);
});

test("weakest bullets name what they lack", () => {
  const result = achievementSignal(["- Helped the team", "- Shipped search in 2 weeks using Postgres FTS"].join("\n"));
  assert.equal(result.bulletLines, 2);
  assert.deepEqual(result.xyz, { x: 1, y: 1, z: 1 });
  assert.deepEqual(result.weakest[0].missing, ["action verb", "measurement", "method"]);
  assert.equal(result.score, 50);
});
