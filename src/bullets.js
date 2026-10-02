// Scores achievement bullets against Laszlo Bock's X-Y-Z formula from Google
// recruiting: "Accomplished [X] as measured by [Y] by doing [Z]". Each bullet
// earns a third for each part it has:
//   X  opens with an action verb, not a duty phrase ("Responsible for")
//   Y  carries a measurement (a number, percentage, currency or multiplier)
//   Z  says how, through a method clause ("by", "using", "through", "via")

const WEAK_OPENERS = new Set([
  "responsible",
  "worked",
  "helped",
  "assisted",
  "involved",
  "participated",
  "duties",
  "tasked",
  "familiar",
  "various"
]);

// Common action verbs whose past tense does not end in "ed".
const IRREGULAR_VERBS = new Set([
  "built",
  "led",
  "ran",
  "wrote",
  "cut",
  "grew",
  "made",
  "won",
  "drove",
  "set",
  "took",
  "brought",
  "taught",
  "rebuilt",
  "rewrote",
  "found",
  "sold",
  "split",
  "shipped"
]);

const MEASURE = /\d|%|[$€£₱]|\b\d*x\b/i;
const METHOD = /\b(by|using|through|via|leveraging)\b/i;

export function scoreBullet(line) {
  const text = line.replace(/^[-*•]\s*/, "").trim();
  const first = (text.match(/^[A-Za-z]+/) || [""])[0].toLowerCase();
  const x = Boolean(first) && !WEAK_OPENERS.has(first) && (first.endsWith("ed") || IRREGULAR_VERBS.has(first));
  const y = MEASURE.test(text);
  const z = METHOD.test(text.slice(first.length));
  return { text, x, y, z, score: (Number(x) + Number(y) + Number(z)) / 3 };
}

export function achievementSignal(resumeText) {
  const bullets = String(resumeText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]/.test(line))
    .map(scoreBullet);

  if (bullets.length === 0) {
    return { bulletLines: 0, quantifiedBullets: 0, xyz: { x: 0, y: 0, z: 0 }, weakest: [], score: 45 };
  }

  const count = (key) => bullets.filter((bullet) => bullet[key]).length;
  const mean = bullets.reduce((sum, bullet) => sum + bullet.score, 0) / bullets.length;
  const weakest = bullets
    .filter((bullet) => bullet.score < 1)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ text, x, y, z }) => ({ text, missing: [!x && "action verb", !y && "measurement", !z && "method"].filter(Boolean) }));

  return {
    bulletLines: bullets.length,
    quantifiedBullets: count("y"),
    xyz: { x: count("x"), y: count("y"), z: count("z") },
    weakest,
    score: Math.round(mean * 100)
  };
}
