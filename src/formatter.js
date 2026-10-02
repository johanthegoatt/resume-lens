function percent(value) {
  return `${Number(value).toFixed(0)}%`;
}

export function formatSummary(result) {
  const keywordHits = result.breakdown.keywords.hits.join(", ") || "none";
  const missingSections = result.breakdown.sections.missing.join(", ") || "none";

  return [
    `Role: ${result.role}`,
    `Overall Score: ${result.score}`,
    `Keyword Score: ${percent(result.breakdown.keywords.score)}`,
    `Section Score: ${percent(result.breakdown.sections.score)}`,
    `Readability Score: ${percent(result.breakdown.readability.score)}`,
    `Achievement Score: ${percent(result.breakdown.achievements.score)}`,
    `Keyword Hits: ${keywordHits}`,
    ...(result.jobMatch
      ? [
          `Job Match: ${percent(result.jobMatch.score)}`,
          `Job Terms Missing: ${result.jobMatch.missing.join(", ") || "none"}`
        ]
      : []),
    `Missing Sections: ${missingSections}`,
    "Suggestions:",
    ...result.suggestions.map((line) => `- ${line}`)
  ].join("\n");
}
