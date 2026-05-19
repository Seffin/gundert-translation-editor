# Sprint 0 TDD Execution (No Coding)

## Purpose

Translate product direction into test-first artifacts so implementation can begin only after expected behavior is explicit and verifiable.

## Working Rules

- No implementation code in Sprint 0
- Every planned feature must have acceptance criteria before development
- Review and facilitator sign-off required before tests are marked ready

## Next Actions Breakdown

### Action 1: Finalize Pilot Language Pairs and OBS Sample Corpus

Owner: Translation facilitator (with dev support)

Deliverables:

1. Pilot language matrix (3 pairs)
2. Script and rendering notes per target language
3. OBS sample corpus set for MVP evaluation
4. Quality review rubric aligned to pilot languages

Checklist:

1. Select one Latin-script language pair
2. Select two Indic-script language pairs
3. Confirm representative challenges for each pair:
   - long narrative flow
   - terminology consistency
   - punctuation and segmentation behavior
4. Choose corpus subset for rapid iteration:
   - 3 stories for smoke tests
   - 10 stories for pilot baseline
5. Store all selections in an auditable project note

Exit criteria:

1. Language pairs approved by facilitator
2. Corpus subset frozen for MVP test runs

### Action 2: Define Reviewer Rubric and Glossary Starter List

Owner: Translation facilitator

Deliverables:

1. Reviewer rubric v1
2. Glossary starter list v1
3. Blocking rules for review workflow

Checklist:

1. Define reviewer quality dimensions:
   - meaning fidelity
   - naturalness
   - terminology consistency
   - readability
2. Define scoring scale and reject thresholds
3. Define unresolved comment blocking rule
4. Seed glossary with high-priority terms from OBS sample
5. Add per-term guidance:
   - preferred translation
   - avoid list
   - rationale

Exit criteria:

1. Rubric validated against 3 sample stories
2. Glossary has enough terms to evaluate consistency checks

### Action 3: Freeze MVP Backlog to Sprint 1 Must-Ship Scope

Owner: Developers + facilitator

Deliverables:

1. Sprint 1 backlog with only must-ship stories
2. Out-of-scope list for sprint protection
3. Story-by-story acceptance criteria references

Checklist:

1. Keep only Sprint 1 items from product direction
2. Convert each item to a testable story
3. Add explicit non-goals as exclusions
4. Estimate each story and assign owner
5. Commit sprint freeze decision to project notes

Exit criteria:

1. No undefined Sprint 1 stories
2. Every story maps to acceptance tests

### Action 4: Start Daily oddkit Decision/Blocker Encoding

Owner: Whole team

Deliverables:

1. Daily decision log
2. Daily blocker log
3. Weekly summary of opens and resolutions

Daily template:

1. Decision made
2. Why it was made
3. Evidence used
4. Open risks
5. Blockers and owner

Exit criteria:

1. Each workday has at least one encoded entry if decisions or blockers occurred
2. Weekly review can reconstruct why scope changed or held

## TDD Readiness Gate (Before Coding)

All conditions must be true:

1. Pilot languages and corpus are frozen
2. Reviewer rubric and glossary are approved
3. Sprint 1 backlog is frozen
4. Acceptance test suite draft exists for all Sprint 1 stories
5. Team agrees on pass/fail evidence for each test

## Suggested 5-Day Sprint 0 Calendar

Day 1:

1. Finalize language candidates
2. Draft corpus shortlist

Day 2:

1. Complete language pair decision
2. Freeze initial corpus subset

Day 3:

1. Draft reviewer rubric
2. Build glossary starter list

Day 4:

1. Freeze Sprint 1 backlog
2. Review acceptance tests

Day 5:

1. Run TDD readiness gate
2. Encode decision package and start Sprint 1
