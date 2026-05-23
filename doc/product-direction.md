# Product Direction: OBS Translation Platform (MVP)

## North Star

Build the fastest trustworthy workflow for Gateway language teams to create Open Bible Stories (OBS) translations with LLM assistance, where AI accelerates drafting and consistency checks, and humans retain final authority.

## Team and Delivery Constraints

- Team: 2 developers + 1 translation facilitator
- Delivery expectation: MVP in 1-2 sprints
- Build stack: Svelte web app with Bun package manager
- AI model: Gemini

## V1 Scope

1. Resource scope: Open Bible Stories only
2. User scope: Gateway language teams producing resources for mother tongue translators
3. Language scope: one Latin script pilot language + two Indic script pilot languages
4. AI scope: first-pass whole-story draft generation (with optional chunk-level mode), rewrite suggestions, consistency and terminology warnings
5. Workflow scope: AI draft -> translator edit -> reviewer check -> project approval
6. Trust boundary: no automatic final publish; human approval required for reviewed and approved states

## Non-Goals (MVP)

1. Resource coverage beyond OBS
2. Audio workflows
3. Advanced linguistic analysis and other nice-to-have features
4. Enterprise-level admin complexity

## Priority Feature Set (Ordered)

1. OBS project import and chunked editing workspace
2. One-click Gemini whole-story draft with side-by-side source and target, plus optional chunk-level draft mode
3. Segment status flow: Draft, In Review, Approved
4. Roles: Translator, Reviewer, Project Lead
5. Reviewer comments and blocking unresolved-comment rule
6. Glossary/term consistency warnings across story chunks
7. Change history and AI suggestion trace for accountability

## MVP Success Metrics (Pilot Window: 8-12 Weeks)

1. Speed: at least 30% faster completion for an OBS story set vs manual baseline
2. Quality: at least 20% reduction in reviewer-rejected segments after AI-assisted drafting
3. Adoption: at least 3 pilot teams using the full draft-to-approval flow weekly

## Sprint Plan

### Sprint 1 (Must Ship Core Flow)

1. Project setup with Bun + Svelte app shell
2. OBS text ingestion and chunk rendering
3. Gemini draft endpoint and generate action in editor, including whole-story drafting and optional chunk mode
4. Translator editing and save states
5. Basic role gating and status transitions
6. Minimal audit trail for each segment action

### Sprint 2 (Trust and Team Readiness)

1. Reviewer comment system with blocking rule
2. Consistency checks against glossary/term list
3. Indic + Latin script QA hardening in editor and layout
4. Project lead approval dashboard
5. Pilot telemetry for speed and rejection metrics
6. Pilot onboarding docs and facilitator checklist

## Team Responsibilities

- Developer 1: architecture, data model, workflow states, permissions
- Developer 2: editor UX, Gemini integration, consistency checks, script support
- Translation facilitator: glossary seed, reviewer rubric, pilot feedback loop, quality gate criteria

## oddkit Operating Loop

1. Orient at the start of each session on the current sprint objective
2. Challenge assumptions before adding scope
3. Encode decisions immediately when tradeoffs are made
4. Validate before claiming done with evidence from tests and UI proof
5. Keep an open-items ledger so context is not lost between sessions

## Top Risks and Mitigations

1. AI over-trust
   - Mitigation: mandatory human approval and explicit low-confidence flags
2. Indic script rendering/input issues
   - Mitigation: script-focused UI test checklist starting in Sprint 1
3. Scope creep within 1-2 sprints
   - Mitigation: OBS-only scope, fixed role model, strict non-goals

## Immediate Next Actions

1. Finalize the 3 pilot language pairs and sample OBS corpus using pilot-language-and-corpus-freeze.md
2. Define reviewer rubric and glossary starter list with facilitator using reviewer-rubric-and-glossary-v1.md
3. Freeze MVP backlog to Sprint 1 must-ship scope using sprint-1-backlog-freeze.md
4. Start daily oddkit decision/blocker encoding using oddkit-daily-decision-log.md (TDD phase: no implementation code yet)

## Execution Artifacts

1. Sprint 0 plan (no coding): see sprint-0-tdd-execution.md
2. Sprint 1 acceptance criteria (test-first): see sprint-1-acceptance-tests.md
3. PRD (implementation-ready): see prd-mvp-implementation.md
4. Detailed TDD test plan: see tdd-test-plan.md
5. Sprint 1 execution plan: see sprint-1-implementation-plan.md
