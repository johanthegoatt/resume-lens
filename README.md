# Resume Lens

## Description
Resume Lens is a local heuristic resume analyzer that scores resumes against role-based rubrics and explains why each score was produced.

## Features
- Role-specific keyword and section weighting (`fullstack`, `data`, `frontend`)
- Section detection by heading line, accepting the variants ATS parsers recognise (Work History, Technical Skills) and flagging creative headings
- Keyword aliases (`ReactJS`, `PostgreSQL`, `machine learning`) with a reminder to also write the exact term, since many ATS filters match literally
- Bullet scoring on Google's X-Y-Z formula: action verb, measurement, method
- Job-description match (`--jd`) weighted with the BM25 term-frequency curve
- Transparent breakdown for keywords, section coverage, and readability
- Actionable suggestions for missing sections or weak keyword coverage
- CLI for evaluating text files or a built-in sample resume
- Local-only processing with no external APIs

## Run
```bash
cd resume-lens
npm start -- data/sample-resume.txt fullstack
```

Summary format with explicit flags:

```bash
cd resume-lens
npm start -- --input data/sample-resume.txt --role fullstack --format summary
```

Compare against a job description:

```bash
cd resume-lens
npm start -- --input data/sample-resume.txt --jd data/sample-job.txt --format summary
```

Write report to disk:

```bash
cd resume-lens
npm start -- --input data/sample-resume.txt --role data --format json --output data/report.json
```

## How the scores work

| Part | Weight | Method |
| --- | --- | --- |
| Keywords | 40% | Rubric keywords, matched exactly or through an alias list (`src/aliases.js`) |
| Sections | 30% | Headings on their own line, a `Label:` prefix, or all caps (`src/sections.js`) |
| Readability | 20% | Word count bands, best between 220 and 700 words |
| Achievements | 10% | Mean X-Y-Z score per bullet (`src/bullets.js`) |

The job match is reported separately and does not change the overall score. Each posting term is weighted by `tf * 2.2 / (tf + 1.2)`, the BM25 saturation curve with k1 = 1.2, doubled for named tech skills. Per-sentence IDF was left out on purpose: a posting repeats its key skills, which IDF would push down.

## Test
```bash
cd resume-lens
npm test
```

## Project Structure
```text
resume-lens/
  data/
    sample-resume.txt
  src/
    aliases.js
    analyzer.js
    bullets.js
    cli.js
    formatter.js
    jobmatch.js
    rubric.js
    sections.js
  tests/
    analyzer.test.js
    formatter.test.js
  package.json
  README.md
```
