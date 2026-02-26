# Resume Lens

## Description
Resume Lens is a local heuristic resume analyzer that scores resumes against role-based rubrics and explains why each score was produced.

## Features
- Role-specific keyword and section weighting (`fullstack`, `data`, `frontend`)
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

Write report to disk:

```bash
cd resume-lens
npm start -- --input data/sample-resume.txt --role data --format json --output data/report.json
```

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
    analyzer.js
    cli.js
    formatter.js
    rubric.js
  tests/
    analyzer.test.js
    formatter.test.js
  package.json
  README.md
```
