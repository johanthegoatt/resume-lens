import { requiredSections, roleRubrics } from "./rubric.js";
import { detectSections } from "./sections.js";

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countWords(text) {
  return tokenize(text).length;
}

function keywordBreakdown(tokens, rubricKeywords) {
  const tokenSet = new Set(tokens);
  let earned = 0;
  let possible = 0;
  const hits = [];
  const misses = [];

  for (const [keyword, weight] of Object.entries(rubricKeywords)) {
    possible += weight;
    if (tokenSet.has(keyword)) {
      earned += weight;
      hits.push(keyword);
    } else {
      misses.push(keyword);
    }
  }

  return {
    earned,
    possible,
    hits,
    misses,
    score: possible > 0 ? Math.round((earned / possible) * 100) : 0
  };
}

function sectionBreakdown(text, sectionWeights) {
  const { found, unrecognised } = detectSections(text);
  let earned = 0;
  let possible = 0;
  const present = [];
  const missing = [];

  for (const [section, weight] of Object.entries(sectionWeights)) {
    possible += weight;
    if (found.has(section)) {
      earned += weight;
      present.push(section);
    } else {
      missing.push(section);
    }
  }

  return {
    earned,
    possible,
    present,
    missing,
    unrecognised,
    score: possible > 0 ? Math.round((earned / possible) * 100) : 0
  };
}

function brevityScore(wordCount) {
  if (wordCount < 140) return 35;
  if (wordCount < 220) return 65;
  if (wordCount <= 700) return 100;
  if (wordCount <= 900) return 82;
  return 58;
}

function suggestionList(sectionStats, keywordStats) {
  const suggestions = [];

  if (sectionStats.missing.length > 0) {
    suggestions.push(`Add missing sections: ${sectionStats.missing.join(", ")}.`);
  }

  if (sectionStats.unrecognised.length > 0) {
    suggestions.push(
      `Rename headings a parser will not recognise: ${sectionStats.unrecognised.slice(0, 3).join(", ")}.`
    );
  }

  if (keywordStats.misses.length > 0) {
    suggestions.push(`Consider role keywords: ${keywordStats.misses.slice(0, 6).join(", ")}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Good baseline coverage. Next step: replace generic bullets with measurable outcomes.");
  }

  return suggestions;
}

function achievementSignal(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = lines.filter((line) => /^[-*•]/.test(line));
  if (bulletLines.length === 0) {
    return {
      bulletLines: 0,
      quantifiedBullets: 0,
      score: 45
    };
  }
  const quantifiedBullets = bulletLines.filter((line) => /\d/.test(line)).length;
  const ratio = quantifiedBullets / bulletLines.length;
  return {
    bulletLines: bulletLines.length,
    quantifiedBullets,
    score: Math.round(ratio * 100)
  };
}

export function analyzeResume(text, role = "fullstack") {
  const safeRole = roleRubrics[role] ? role : "fullstack";
  const rubric = roleRubrics[safeRole];

  const tokens = tokenize(text);
  const words = countWords(text);
  const keywordStats = keywordBreakdown(tokens, rubric.keywords);
  const sectionStats = sectionBreakdown(text, rubric.sectionWeights);
  const readability = brevityScore(words);
  const achievements = achievementSignal(text);

  const overall = Math.round(
    keywordStats.score * 0.4 +
    sectionStats.score * 0.3 +
    readability * 0.2 +
    achievements.score * 0.1
  );

  return {
    role: safeRole,
    score: overall,
    breakdown: {
      keywords: keywordStats,
      sections: sectionStats,
      readability: {
        words,
        score: readability
      },
      achievements
    },
    requiredSections,
    suggestions: suggestionList(sectionStats, keywordStats)
  };
}
