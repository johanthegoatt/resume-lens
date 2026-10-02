import { requiredSections, roleRubrics } from "./rubric.js";
import { detectSections } from "./sections.js";
import { findKeyword } from "./aliases.js";
import { achievementSignal } from "./bullets.js";

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
  const viaAlias = {};

  for (const [keyword, weight] of Object.entries(rubricKeywords)) {
    possible += weight;
    const match = findKeyword(tokens, tokenSet, keyword);
    if (match) {
      earned += weight;
      hits.push(keyword);
      if (match !== "exact") viaAlias[keyword] = match;
    } else {
      misses.push(keyword);
    }
  }

  return {
    earned,
    possible,
    hits,
    misses,
    viaAlias,
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

function suggestionList(sectionStats, keywordStats, achievements) {
  const suggestions = [];

  if (sectionStats.missing.length > 0) {
    suggestions.push(`Add missing sections: ${sectionStats.missing.join(", ")}.`);
  }

  if (sectionStats.unrecognised.length > 0) {
    suggestions.push(
      `Rename headings a parser will not recognise: ${sectionStats.unrecognised.slice(0, 3).join(", ")}.`
    );
  }

  const aliasOnly = Object.entries(keywordStats.viaAlias);
  if (aliasOnly.length > 0) {
    // Many ATS filters match keywords literally, so spell out the canonical term too.
    const pairs = aliasOnly.slice(0, 4).map(([keyword, alias]) => `${keyword} (found as "${alias}")`);
    suggestions.push(`Also write the exact term for: ${pairs.join(", ")}.`);
  }

  if (keywordStats.misses.length > 0) {
    suggestions.push(`Consider role keywords: ${keywordStats.misses.slice(0, 6).join(", ")}.`);
  }

  for (const bullet of achievements.weakest) {
    suggestions.push(`Bullet "${bullet.text.slice(0, 48)}" is missing: ${bullet.missing.join(", ")}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Good baseline coverage. Next step: replace generic bullets with measurable outcomes.");
  }

  return suggestions;
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
    suggestions: suggestionList(sectionStats, keywordStats, achievements)
  };
}
