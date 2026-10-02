import { keywordAliases } from "./aliases.js";

// Compares a resume with a pasted job description. Each job-description term
// gets a weight from two parts:
//   tf saturation  tf * (k1 + 1) / (tf + k1) with k1 = 1.2, the Okapi BM25
//                  term-frequency curve, so a skill named three times counts
//                  for more than one mention but not three times as much
//   skill boost    x2 for terms in the tech lexicon, so "kafka" outranks
//                  "dashboard" when both appear once
// A single posting has no corpus to learn document frequency from (its key
// skills repeat, which per-sentence IDF would punish), so filler is removed
// with a stoplist instead. Coverage is the share of weight the resume contains.

const K1 = 1.2;
const SKILL_BOOST = 2;

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can for from has have in is it its of on or our " +
    "that the their this to was we will with you your who what when where which while " +
    "about all also any able across into more most must not other over such than then " +
    "they them these those through up very well would should could may like role job " +
    "including etc per plus year years work working team teams strong ability experience " +
    "bonus nice own build write every each new using use help join looking engineer " +
    "engineers developer company changes call day days great good"
  ).split(" ")
);

// Spelling variants only. Rubric aliases such as kubernetes -> docker are fine
// for "has container experience" but would wrongly satisfy a posting that asks
// for Kubernetes by name.
const SPELLING = new Map([
  ["nodejs", "node"],
  ["reactjs", "react"],
  ["js", "javascript"],
  ["ts", "typescript"],
  ["postgres", "postgresql"],
  ["k8s", "kubernetes"],
  ["golang", "go"],
  ["apis", "api"]
]);

const EXTRA_SKILLS =
  "aws gcp azure kafka redis terraform kubernetes graphql rest grpc go rust java kotlin swift " +
  "postgresql mongodb elasticsearch observability prometheus grafana ci cd linux nextjs vue " +
  "svelte angular figma webpack vite microservices idempotent oauth security payments llm";

const SKILLS = new Set([
  ...Object.keys(keywordAliases),
  ...Object.values(keywordAliases).flat().filter((alias) => !alias.includes(" ")),
  ...EXTRA_SKILLS.split(" ")
]);

function terms(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => SPELLING.get(token) || token)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token) && !/^\d+$/.test(token));
}

export function bm25Saturation(tf, k1 = K1) {
  return (tf * (k1 + 1)) / (tf + k1);
}

export function jobMatch(resumeText, jobText, { top = 8 } = {}) {
  const jobTerms = terms(jobText);
  if (jobTerms.length === 0) return null;

  const tf = new Map();
  for (const term of jobTerms) tf.set(term, (tf.get(term) || 0) + 1);

  const resumeTerms = new Set(terms(resumeText));
  const weighted = [...tf].map(([term, count]) => ({
    term,
    weight: bm25Saturation(count) * (SKILLS.has(term) ? SKILL_BOOST : 1),
    found: resumeTerms.has(term)
  }));
  weighted.sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term));

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  const earned = weighted.filter((item) => item.found).reduce((sum, item) => sum + item.weight, 0);
  const pick = (found) => weighted.filter((item) => item.found === found).slice(0, top).map((item) => item.term);

  return {
    score: total > 0 ? Math.round((earned / total) * 100) : 0,
    matched: pick(true),
    missing: pick(false)
  };
}
