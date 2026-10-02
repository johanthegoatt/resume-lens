// Spelling variants that mean the same rubric keyword. Text is tokenised before
// lookup, so "Node.js" arrives as "node js" and "CI/CD" as "ci cd".
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
  if (tokenSet.has(keyword)) return "exact";
  for (const alias of keywordAliases[keyword] || []) {
    const parts = alias.split(" ");
    const hit = parts.length === 1 ? tokenSet.has(alias) : containsPhrase(tokens, parts);
    if (hit) return alias;
  }
  return null;
}
