# Resume Lens Runbook

## Purpose

Analyze resume text against role-specific rubric criteria and emit actionable feedback.

## Setup

```powershell
cd resume-lens
npm install
```

## Run (JSON)

```powershell
cd resume-lens
npm start -- --input data/sample-resume.txt --role fullstack --format json
```

## Run (Summary)

```powershell
cd resume-lens
npm start -- --input data/sample-resume.txt --role frontend --format summary
```

## Verify

```powershell
cd resume-lens
npm test
```
