# Changelog

## 1.2.0 - 2026-10-02

- Sections count only under a heading line, using the standard variants ATS parsers route; creative headings are flagged for renaming.
- Rubric keywords match spelling variants and phrase aliases, with a prompt to also write the exact term.
- Bullets are scored on the X-Y-Z formula (action verb, measurement, method) and the weakest three are named.
- `--jd <file>` scores coverage of a job description using BM25 term-frequency saturation and a skill boost.
- CI on Node 20, 22 and 24.

## 1.1.0 - 2026-02-25

- Added CLI flags (`--input`, `--role`, `--format`, `--output`) with legacy positional compatibility.
- Added summary formatter for non-JSON resume review output.
- Added formatter test coverage and support files (`.gitignore`, runbook).

## 1.0.0 - 2026-02-23

- Initial rubric-driven local resume analyzer and CLI.
