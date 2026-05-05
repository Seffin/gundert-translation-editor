# PRD: Gundert Editor MVP Implementation

## Document Control
- Version: 1.0
- Date: 2026-05-05
- Status: Ready for implementation
- Product: Gundert Editor

## Product Summary
Gundert Editor is a web application for Gateway language teams translating Open Bible Stories (OBS) with Gemini-assisted drafting. The product accelerates translation while preserving human authority for review and approval.

## Problem Statement
Current OBS workflows are manual and slow. Teams need AI acceleration for first drafts and consistency checks without losing human oversight or translation quality.

## Goals
1. Reduce time to complete OBS translation workflows by at least 30% versus manual baseline.
2. Reduce reviewer-rejected segments by at least 20% through guided AI drafting and glossary consistency support.
3. Enable at least 3 pilot teams to run weekly through Draft -> Review -> Approval.

## Non-Goals
1. Audio workflows.
2. Non-OBS resource support.
3. Advanced linguistic analytics beyond glossary consistency and core warnings.
4. Enterprise admin suite.

## Users and Roles
1. Translator: drafts, edits, submits for review.
2. Reviewer: comments, resolves issues, gates quality.
3. Project Lead: approves ready stories, manages blocked stories.
4. Translation facilitator: rubric/glossary governance and pilot quality oversight.

## Scope (MVP)
1. OBS import and story rendering with stable segment order.
2. Story editor with source/target side-by-side.
3. Gemini whole-story draft generation.
4. Optional chunk-level draft generation for selected segments.
5. Save states and unsaved-change safeguards.
6. Role-based status transitions: Draft -> In Review -> Approved.
7. Reviewer comments and unresolved-comment gating.
8. Glossary view and consistency warnings.
9. Activity log with AI/human provenance.

## Core Workflow
1. Translator opens story.
2. Translator generates whole-story draft (primary) or selected chunk draft (secondary).
3. Translator edits segments and saves.
4. Translator submits story for review.
5. Reviewer resolves comments and terminology issues.
6. Project Lead approves only stories with no blockers.

## Functional Requirements
### FR-1 OBS Import
- System imports OBS stories and renders them in canonical order.
- System preserves source segmentation.

### FR-2 AI Drafting
- System supports one-click whole-story draft generation.
- System supports chunk draft generation for selected segments.
- System labels AI output with provenance (actor, scope, timestamp).

### FR-3 Editor Integrity
- System supports segment-level edits and save.
- System warns on unsaved changes before navigation.
- System shows loading state, partial success state, and retry path for AI failures.

### FR-4 Review and Approval Gating
- Submit for Review is blocked when required conditions are not met.
- Approve All Ready only acts on eligible stories.
- Blocked stories display actionable reasons.

### FR-5 Audit Trail
- Every key action logs actor, timestamp, action type, and context.
- Log distinguishes AI-generated actions from human edits/reviews.

## UI and Brand Requirements
1. Brand name must be consistent: Gundert Editor.
2. Page titles must be consistent: no legacy names.
3. UI screens should follow the existing design direction in ui/editorial_translation_system/DESIGN.md.
4. Use UI artifacts in ui/* as reference for component behavior and states.

## Brand/Title Consistency Acceptance Criteria
1. All page <title> tags contain Gundert Editor.
2. No occurrence of legacy brand strings in UI routes or page chrome.
3. Header and side navigation brand labels are identical across all main views.

## Technical Constraints
1. Frontend: Svelte.
2. Package manager/runtime tooling: Bun.
3. AI provider: Gemini.
4. Unicode-safe rendering for Latin + Indic scripts.

## Success Metrics
1. Speed metric: >=30% faster completion over manual baseline.
2. Quality metric: >=20% reduction in reviewer rejections.
3. Adoption metric: >=3 active pilot teams in weekly use.

## Risks and Mitigations
1. AI over-trust.
   - Mitigation: strict human approval gates and clear AI provenance.
2. Script rendering/input issues.
   - Mitigation: script-specific QA and visual regression checks.
3. Scope creep.
   - Mitigation: enforce Sprint 1 must-ship freeze and tradeoff rule.

## Dependencies
1. Frozen pilot language pairs and corpus.
2. Reviewer rubric and glossary starter list.
3. Approved Sprint 1 backlog.
4. Sprint task board ready for execution (sprint-1-task-board.md).

## Definition of Done (MVP Slice)
1. All Sprint 1 acceptance tests pass with evidence.
2. Brand/title consistency checks pass.
3. Role gating and audit trail verified.
4. Pilot facilitator confirms review readiness.
