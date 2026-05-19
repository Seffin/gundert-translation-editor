# Sprint 1 Implementation Plan

## Sprint Goal

Deliver MVP core flow for OBS translation with Gemini drafting and human-gated review, using UI artifacts as implementation guidance.

## Team

1. Dev 1: data model, permissions, transitions, audit.
2. Dev 2: story editor, AI drafting flows, UI state behavior.
3. Facilitator: rubric/glossary governance and acceptance review.

## Execution Board

1. Use sprint-1-task-board.md as the operational board for daily execution.
2. Move items across Backlog -> Ready -> In Progress -> Review -> Done with evidence.

## Planned Duration

- 10 working days (adaptable to 1-2 sprint window).

## UI-Driven Scope Map

1. Dashboard: ui/project_dashboard_gundert_editor
2. Story list: ui/story_list_gundert_editor
3. Story editor baseline: ui/story_editor_gundert_editor
4. Story editor chunk flow: ui/story_editor_chunk_selection_flow
5. AI generating state: ui/story_editor_ai_generating_state
6. Partial success state: ui/story_editor_partial_success_state
7. Unsaved warning dialog: ui/story_editor_unsaved_warning_dialog
8. Reviewer queue: ui/reviewer_queue_default_view
9. Project lead gating: ui/project_lead_approval_gating_view
10. Glossary flows: ui/glossary_management_gundert_editor + ui/glossary_add_edit_flow
11. Activity log: ui/activity_log_gundert_editor + ui/activity_log_filtered_state

## Work Breakdown

### Workstream A: Foundation and Domain (Dev 1)

1. Define story, segment, status, role, and audit models.
2. Implement OBS import and canonical ordering.
3. Implement permission matrix and transition guards.
4. Implement audit event pipeline.

### Workstream B: Editor and AI Flows (Dev 2)

1. Build side-by-side editor layout.
2. Implement whole-story draft action.
3. Implement selected-chunk draft action.
4. Implement loading, partial success, retry, and unsaved warning states.

### Workstream C: Review and Approval (Dev 1 + Dev 2)

1. Reviewer queue interactions and resolve flow.
2. Project lead approval gating with blocker visibility.
3. Enforce unresolved-comment and conflict gates.

### Workstream D: Glossary + Provenance (Dev 2)

1. Glossary list and add/edit forms.
2. Consistency warning panel in editor.
3. AI/human provenance labeling across UI and logs.

### Workstream E: Brand Consistency Hardening (Both Devs)

1. Normalize app titles to Gundert Editor.
2. Remove legacy brand strings from UI shell/pages.
3. Add regression test for title/brand consistency.

## Day-by-Day Plan

Day 1:

1. Finalize architecture and data contracts.
2. Set up test harness and CI checks.

Day 2:

1. Implement OBS import and story list ordering.
2. Write and pass tests for import/order.

Day 3:

1. Build editor baseline and save model.
2. Add unsaved-change guard tests.

Day 4:

1. Implement whole-story draft flow.
2. Add generating/loading state.

Day 5:

1. Implement selected-chunk draft flow.
2. Add chunk selection behavior tests.

Day 6:

1. Implement partial success and retry.
2. Add failure-path integration tests.

Day 7:

1. Implement reviewer queue and resolve actions.
2. Implement role transition guards.

Day 8:

1. Implement project lead approval gating.
2. Add blocker reasons and approve-ready constraints.

Day 9:

1. Implement glossary add/edit + warnings.
2. Implement activity log filters and provenance tags.

Day 10:

1. Brand/title consistency sweep.
2. End-to-end test run and bugfix pass.
3. Prepare acceptance evidence pack.

## TDD Execution Rules

1. No feature merge without test first (Red-Green-Refactor).
2. Each story must map to at least one failing test before implementation.
3. Add E2E test for every cross-role workflow transition.
4. Keep fixtures for smoke stories 29, 35, 38.

## Merge Gates

1. All critical tests pass.
2. No blocker defects in core workflow.
3. Brand/title consistency checks pass.
4. Acceptance evidence captured and reviewed.

## Delivery Artifacts

1. Test reports (unit/integration/e2e).
2. UI screenshots for critical states.
3. Decision and blocker logs in oddkit daily log.
4. Sprint closeout summary with remaining open items.
