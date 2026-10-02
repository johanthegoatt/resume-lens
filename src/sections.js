// Applicant tracking systems file resume content by its section heading, so a
// section only counts when it sits under a heading a parser would recognise.
// Matching the word anywhere in the text gave false positives: "experienced
// with React" used to earn the whole Experience section.
export const sectionAliases = {
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "relevant experience",
    "work history",
    "employment",
    "employment history",
    "career history"
  ],
  projects: ["projects", "personal projects", "selected projects", "side projects", "key projects"],
  education: ["education", "academic background", "education and training"],
  skills: ["skills", "technical skills", "core skills", "key skills", "technologies", "tech stack"]
};

const MAX_HEADING_WORDS = 5;

function normaliseHeading(line) {
  return line
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A line reads as a heading when it is short and either stands alone, ends in a
// colon, is written in capitals, or opens with a colon-terminated label
// ("Skills: React, Node").
function headingCandidate(rawLine) {
  const line = rawLine.trim().replace(/^#+\s*/, "");
  if (!line || /^[-*•]/.test(line)) return null;

  const labelled = line.match(/^([^:]{1,40}):/);
  if (labelled) return normaliseHeading(labelled[1]);

  const words = line.split(/\s+/);
  if (words.length > MAX_HEADING_WORDS) return null;
  const letters = line.replace(/[^A-Za-z]/g, "");
  const shouting = letters.length > 2 && letters === letters.toUpperCase();
  const standalone = words.length <= 3 && !/[.,;]$/.test(line);
  return shouting || standalone ? normaliseHeading(line) : null;
}

function sectionFor(heading) {
  for (const [section, aliases] of Object.entries(sectionAliases)) {
    if (aliases.includes(heading)) return section;
  }
  return null;
}

export function detectSections(text) {
  const found = new Set();
  const unrecognised = [];

  for (const rawLine of String(text).split(/\r?\n/)) {
    const heading = headingCandidate(rawLine);
    if (!heading) continue;
    const section = sectionFor(heading);
    if (section) {
      found.add(section);
    } else if (rawLine.trim().endsWith(":") || /^[^a-z]*$/.test(rawLine.trim())) {
      // Only flag lines that were clearly meant as headings.
      unrecognised.push(rawLine.trim().replace(/:$/, ""));
    }
  }

  return { found, unrecognised };
}
