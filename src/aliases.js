// Spelling variants that mean the same rubric keyword. Text is tokenised before
// lookup, after normalizeTech, so "Node.js" arrives as "nodejs" and "CI/CD"
// as "ci cd".
export const keywordAliases = {
  javascript: ["js", "es6", "ecmascript"],
  typescript: ["ts"],
  react: ["reactjs", "react js", "react native"],
  node: ["nodejs", "node js"],
  api: ["apis", "rest", "graphql"],
  testing: ["tests", "tested", "unit tests", "jest", "vitest", "playwright", "cypress"],
  sql: ["postgres", "postgresql", "mysql", "sqlite"],
  docker: ["containers", "containerised", "containerized", "kubernetes"],
  css: ["css3", "tailwind", "sass", "scss"],
  accessibility: ["a11y", "wcag", "aria"],
  performance: ["core web vitals", "latency"],
  animation: ["animations", "motion"],
  python: ["py"],
  model: ["models", "modelling", "modeling"],
  ml: ["machine learning", "scikit learn", "sklearn", "pytorch", "tensorflow"],
  statistics: ["statistical", "stats"],
  experiment: ["experiments", "experimentation", "a b testing", "a b tests"]
};

// Names whose punctuation is the name. Stripping it first turned "C++" and
// "C#" into a bare "c" (then dropped) and "Node.js" into "node js", whose
// "js" then read as a separate JavaScript requirement.
const TECH_NAMES = [
  [/(^|[^a-z0-9])c\+\+(?![a-z0-9])/gi, "$1 cplusplus "],
  [/(^|[^a-z0-9])c#(?![a-z0-9])/gi, "$1 csharp "],
  [/(^|[^a-z0-9])f#(?![a-z0-9])/gi, "$1 fsharp "],
  [/(^|[^a-z0-9])asp\.net(?![a-z0-9])/gi, "$1 aspnet "],
  [/(^|[^a-z0-9])\.net(?![a-z0-9])/gi, "$1 dotnet "],
  [/\b([a-z0-9]+)\.js\b/gi, "$1js"]
];

export function normalizeTech(text) {
  return TECH_NAMES.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), String(text));
}

function containsPhrase(tokens, phraseTokens) {
  outer: for (let i = 0; i + phraseTokens.length <= tokens.length; i += 1) {
    for (let j = 0; j < phraseTokens.length; j += 1) {
      if (tokens[i + j] !== phraseTokens[j]) continue outer;
    }
    return true;
  }
  return false;
}

// Returns how a keyword was found: "exact", the alias that matched, or null.
export function findKeyword(tokens, tokenSet, keyword) {
  // "Node.js" is the official spelling of node, not a variant of it.
  if (tokenSet.has(keyword) || tokenSet.has(`${keyword}js`)) return "exact";
  for (const alias of keywordAliases[keyword] || []) {
    const parts = alias.split(" ");
    const hit = parts.length === 1 ? tokenSet.has(alias) : containsPhrase(tokens, parts);
    if (hit) return alias;
  }
  return null;
}
