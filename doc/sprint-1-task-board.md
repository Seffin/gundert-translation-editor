# Sprint 1 Task Board (Implementation)

## Board Meta

- Sprint: Sprint 1 MVP Core Flow
- Duration: 10 working days
- Team: Dev 1, Dev 2, Translation Facilitator
- Source plans: prd-mvp-implementation.md, tdd-test-plan.md, sprint-1-implementation-plan.md
- Rule: TDD first (Red -> Green -> Refactor)

## Workflow Columns

1. Backlog
2. Ready
3. In Progress
4. Review
5. Done

## WIP Limits

- In Progress: max 2 tasks per developer
- Review: max 3 tasks total

## Priority Legend

- P0: critical path blocker
- P1: must-ship for sprint goal
- P2: useful but can defer only with explicit tradeoff

## Tasks

### P0 Foundation and Data

| ID  | Priority | Task                                                                     | Owner | Estimate | Depends On | TDD Entry                                                   | Acceptance Mapping     | Initial Column |
| --- | -------- | ------------------------------------------------------------------------ | ----- | -------- | ---------- | ----------------------------------------------------------- | ---------------------- | -------------- |
| T1  | P0       | Initialize Svelte + Bun app foundation and test harness                  | Dev 1 | 0.5d     | None       | Write failing smoke test for app boot route                 | Sprint 1 Story 1       | Ready          |
| T2  | P0       | Define domain models (Project, Story, Segment, Role, Status, AuditEvent) | Dev 1 | 0.5d     | T1         | Write schema validation tests first                         | Sprint 1 Stories 1,4,5 | Ready          |
| T3  | P0       | Add route metadata system with brand/title constants                     | Dev 1 | 0.5d     | T1         | Write failing tests for title format                        | Brand consistency gate | Ready          |
| T27 | P0       | Implement target language selector with persistence                      | Dev 1 | 0.5d     | T7         | Failing tests for language load/save and selector rendering | FR-0                   | Ready          |

### P0 OBS Import and Story List

| ID  | Priority | Task                                                        | Owner | Estimate | Depends On | TDD Entry                                            | Acceptance Mapping | Initial Column |
| --- | -------- | ----------------------------------------------------------- | ----- | -------- | ---------- | ---------------------------------------------------- | ------------------ | -------------- |
| T4  | P0       | Implement OBS import parser for en_obs content structure    | Dev 1 | 1.0d     | T2         | Failing parser tests with fixture stories 01, 29, 50 | Sprint 1 Story 1   | Ready          |
| T5  | P0       | Implement canonical story ordering and segment preservation | Dev 1 | 0.5d     | T4         | Failing order + segment-stability tests              | Sprint 1 Story 1   | Ready          |
| T6  | P1       | Implement story list UI with status chips and progress      | Dev 2 | 0.5d     | T4, T5     | Failing component tests for list rendering           | Sprint 1 Story 1   | Backlog        |

### P0 Story Editor Core

| ID  | Priority | Task                                                           | Owner | Estimate | Depends On | TDD Entry                                           | Acceptance Mapping                       | Initial Column |
| --- | -------- | -------------------------------------------------------------- | ----- | -------- | ---------- | --------------------------------------------------- | ---------------------------------------- | -------------- |
| T7  | P0       | Build source/target side-by-side editor layout                 | Dev 2 | 1.0d     | T2, T5     | Failing render test with Indic + Latin text fixture | Sprint 1 Story 3 + cross-cutting Unicode | Ready          |
| T8  | P0       | Implement segment edit + save persistence with actor/timestamp | Dev 2 | 1.0d     | T7         | Failing save and reload persistence tests           | Sprint 1 Story 3                         | Ready          |
| T9  | P0       | Implement unsaved changes guard dialog flow                    | Dev 2 | 0.5d     | T8         | Failing route-leave guard tests                     | Sprint 1 Story 3                         | Backlog        |

### P0 Gemini Drafting

| ID  | Priority | Task                                                             | Owner | Estimate | Depends On | TDD Entry                                            | Acceptance Mapping         | Initial Column |
| --- | -------- | ---------------------------------------------------------------- | ----- | -------- | ---------- | ---------------------------------------------------- | -------------------------- | -------------- |
| T10 | P0       | Implement Gemini whole-story draft request/response adapter      | Dev 2 | 1.0d     | T2, T7     | Failing integration test with mocked Gemini response | Sprint 1 Story 2           | Ready          |
| T11 | P0       | Implement selected-chunk draft flow with segment selection model | Dev 2 | 1.0d     | T10        | Failing tests for selected-only updates              | Sprint 1 Story 2           | Backlog        |
| T12 | P1       | Add AI loading state (skeleton) during generation                | Dev 2 | 0.5d     | T10        | Failing UI state test for pending generation         | Sprint 1 Story 2           | Backlog        |
| T13 | P1       | Add partial-success and retry-failed-segment flow                | Dev 2 | 0.5d     | T10        | Failing tests for mixed success result handling      | Sprint 1 Story 2           | Backlog        |
| T14 | P1       | Add AI provenance labels (scope + timestamp + actor)             | Dev 2 | 0.5d     | T10, T11   | Failing tests for provenance metadata rendering      | Sprint 1 Story 2 + Story 5 | Backlog        |

### P0 Roles, Transitions, and Gating

| ID  | Priority | Task                                                                | Owner | Estimate | Depends On | TDD Entry                                      | Acceptance Mapping | Initial Column |
| --- | -------- | ------------------------------------------------------------------- | ----- | -------- | ---------- | ---------------------------------------------- | ------------------ | -------------- |
| T15 | P0       | Implement role permission matrix (Translator/Reviewer/Lead)         | Dev 1 | 0.5d     | T2         | Failing permission tests by role-action matrix | Sprint 1 Story 4   | Backlog        |
| T16 | P0       | Implement status transition engine (Draft -> In Review -> Approved) | Dev 1 | 0.5d     | T15        | Failing valid/invalid transition tests         | Sprint 1 Story 4   | Backlog        |
| T17 | P0       | Implement review blockers (unresolved comments/conflicts)           | Dev 1 | 0.5d     | T16        | Failing gate tests for blocked approval        | Sprint 1 Story 4   | Backlog        |
| T18 | P1       | Build reviewer queue default interactions and resolve action        | Dev 2 | 0.5d     | T15, T16   | Failing E2E for resolve path                   | Sprint 1 Story 4   | Backlog        |
| T19 | P1       | Build project lead approval gating view and approve-ready action    | Dev 2 | 0.5d     | T17, T18   | Failing E2E for blocked vs ready approval      | Sprint 1 Story 4   | Done           |

### P1 Glossary and Consistency

| ID  | Priority | Task                                                      | Owner | Estimate | Depends On | TDD Entry                            | Acceptance Mapping              | Initial Column |
| --- | -------- | --------------------------------------------------------- | ----- | -------- | ---------- | ------------------------------------ | ------------------------------- | -------------- |
| T20 | P1       | Implement glossary list and add/edit flow                 | Dev 2 | 0.5d     | T2         | Failing create/update glossary tests | Sprint 2 prep + Story 4 support | Done           |
| T21 | P1       | Implement editor terminology warnings from glossary rules | Dev 2 | 0.5d     | T20, T7    | Failing warning-generation tests     | Sprint 2 prep + Story 4 support | Done           |

### P0 Audit Trail

| ID  | Priority | Task                                                               | Owner | Estimate | Depends On   | TDD Entry                                                | Acceptance Mapping | Initial Column |
| --- | -------- | ------------------------------------------------------------------ | ----- | -------- | ------------ | -------------------------------------------------------- | ------------------ | -------------- |
| T22 | P0       | Implement audit event writer for draft/edit/review/approve actions | Dev 1 | 0.5d     | T2, T10, T16 | Failing tests for event emission per action              | Sprint 1 Story 5   | Done           |
| T23 | P1       | Implement activity log UI and filter states                        | Dev 2 | 0.5d     | T22          | Failing component tests for filtering by actor/type/date | Sprint 1 Story 5   | Done           |

### P0 Brand and Title Consistency

| ID  | Priority | Task                                                   | Owner | Estimate | Depends On | TDD Entry                                            | Acceptance Mapping | Initial Column |
| --- | -------- | ------------------------------------------------------ | ----- | -------- | ---------- | ---------------------------------------------------- | ------------------ | -------------- |
| T24 | P0       | Replace legacy brand strings in routes/layout metadata | Dev 1 | 0.25d    | T3         | Failing search-based assertion for forbidden strings | PRD brand criteria | Ready          |
| T25 | P0       | Normalize page titles to Gundert Editor format         | Dev 1 | 0.25d    | T3         | Failing route-title test suite                       | PRD brand criteria | Ready          |
| T26 | P0       | Add CI check to block legacy brand strings in UI       | Dev 1 | 0.25d    | T24        | Failing CI script test first                         | PRD brand criteria | Backlog        |

## Facilitator Tasks

| ID  | Priority | Task                                                     | Owner       | Estimate | Depends On               | Output                    | Initial Column |
| --- | -------- | -------------------------------------------------------- | ----------- | -------- | ------------------------ | ------------------------- | -------------- |
| F1  | P1       | Validate glossary terms against smoke stories 29, 35, 38 | Facilitator | 0.5d     | T20 draft screens        | Approved glossary updates | Ready          |
| F2  | P1       | Review rubric thresholds against test samples            | Facilitator | 0.5d     | T18, T19 flows           | Rubric validation notes   | Backlog        |
| F3  | P0       | Sign off on sprint acceptance evidence pack              | Facilitator | 0.25d    | All done candidate tasks | Go/No-Go decision         | Backlog        |

## Daily Execution Cadence

1. Morning: pick tasks from Ready -> In Progress (respect WIP limits).
2. Midday: ensure each in-progress task has failing tests committed before implementation.
3. End of day: move validated tasks to Review with evidence links.
4. Record decisions/blockers in oddkit-daily-decision-log.md.

## Definition of Done Per Task

1. Tests written first and passing.
2. Acceptance mapping satisfied.
3. Evidence attached (test output + UI state proof when applicable).
4. No brand/title consistency regressions introduced.

## Sprint Exit Gate

1. Tasks T1-T19 and T22-T26 completed or explicitly traded off and approved.
2. Critical E2E journey passes:
   - whole-story draft
   - selected-chunk draft
   - reviewer resolve
   - project lead approval gate
3. Brand/title consistency checks pass.
4. Facilitator sign-off recorded.
