# Implementation Plan: writing

Spec: [SPEC-writing.md](../SPEC-writing.md) · Intent: [docs/intent/writing-series.md](../docs/intent/writing-series.md)
Previous: [case-studies](case-studies-plan.md) (live with case study 1; case study 2 pending).

## Tasks

- [x] W1: Writing infrastructure: `.md` + remark-gfm, registry, `/writing`, `/writing/[slug]`, tags, RSS, nav; tests
- [x] W2: Extend confidentiality guard to all content (writing, case studies, profile)
- [x] W3: Editorial workflow: researcher → writer → editor → evaluator for parts 1, 4, 6 (one revision loop)
- [x] W4: Integrate articles, evaluator reports in `docs/editorial/`, checks, preview
- [ ] Gate: owner says "publish"
- [ ] W5: Merge, Lighthouse, record results

## Risks

| Risk                                            | Mitigation                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Content echoes the Udemy course                 | Evaluator originality check against the outline; own examples; course used as topic map only |
| Client details leak via "production experience" | Confidentiality guard + evaluator + anonymised patterns only                                 |
| Outdated Claude Code facts                      | Researcher uses current official docs; articles dated; evaluator checks config shapes        |
| No owner review                                 | Single publish gate; evaluator reports attached for a quick skim                             |
