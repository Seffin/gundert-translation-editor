# TDD Test Plan: Gundert Editor MVP

## Test Strategy
Implementation follows Red-Green-Refactor across three layers:
1. Unit tests for domain logic.
2. Integration tests for workflows and API contracts.
3. E2E tests for user journeys mapped to UI references.

## Test Stack (Recommended)
1. Unit/Integration: Vitest.
2. Component/UI: Testing Library for Svelte.
3. E2E: Playwright.
4. Lint/type: ESLint + TypeScript checks (if TS is enabled).

## Test Modules and Cases

### Module A: OBS Import and Story Ordering
UI references:
- ui/story_list_gundert_editor

Unit:
1. Parses OBS manifest and story metadata.
2. Sorts stories canonically (01..50).
3. Preserves segment IDs/order.

Integration:
1. Import endpoint returns expected story count.
2. Imported stories render with stable sequence.

E2E:
1. Import OBS package and verify first/last story position.
2. Open a story and verify segment sequence remains stable after reload.

### Module B: AI Drafting (Whole Story + Chunk)
UI references:
- ui/story_editor_gundert_editor
- ui/story_editor_chunk_selection_flow
- ui/story_editor_ai_generating_state
- ui/story_editor_partial_success_state

Unit:
1. Build whole-story draft request payload.
2. Build selected-chunk request payload.
3. Merge AI response without overwriting unselected chunks.
4. Attach provenance metadata (scope, timestamp, actor).

Integration:
1. Whole-story draft call succeeds and maps to all segments.
2. Chunk draft call updates only selected segments.
3. Partial failure returns retryable failed segment list.

E2E:
1. Generate whole-story draft and verify provenance chips on updated segments.
2. Select chunk(s), generate chunk draft, verify only selected chunks changed.
3. Trigger error/partial-success mock response and verify retry segment action.
4. Verify loading/skeleton state is visible during generation.

### Module C: Editor Save and Unsaved Protection
UI references:
- ui/story_editor_gundert_editor
- ui/story_editor_unsaved_warning_dialog

Unit:
1. Dirty-state tracker flips on edit and resets on save.
2. Save payload contains segment diff and actor.

Integration:
1. Save persists edits and updated timestamp.
2. Route guard blocks navigation on dirty state.

E2E:
1. Edit target text, attempt navigation, verify unsaved warning dialog.
2. Choose discard and confirm original persisted state behavior.
3. Choose save-and-leave and confirm data persistence.

### Module D: Role Gating and Status Transitions
UI references:
- ui/reviewer_queue_default_view
- ui/project_lead_approval_gating_view

Unit:
1. Permission matrix by role and action.
2. Transition validator for Draft -> In Review -> Approved.
3. Guard: cannot approve with unresolved comments or blocking conflicts.

Integration:
1. Restricted action returns authorization failure for wrong role.
2. Invalid transition is rejected with reason.

E2E:
1. Translator submits for review.
2. Reviewer resolves comments.
3. Project lead approves eligible story.
4. Verify blocked story shows actionable blockers and cannot be approved.

### Module E: Glossary and Consistency Warnings
UI references:
- ui/glossary_management_gundert_editor
- ui/glossary_add_edit_flow
- ui/story_editor_chunk_selection_flow

Unit:
1. Glossary lookup by term/language.
2. Warning engine flags mismatched preferred terms.
3. Warning state clears after compliant edit.

Integration:
1. Create/update glossary term persists and appears in list.
2. Story editor warning panel reflects glossary state.

E2E:
1. Add glossary entry and verify warning behavior in editor.
2. Resolve warning and verify blocker count decreases.

### Module F: Activity Log and Provenance
UI references:
- ui/activity_log_gundert_editor
- ui/activity_log_filtered_state

Unit:
1. Audit event schema validation.
2. Event classifier distinguishes AI vs human events.

Integration:
1. Key actions emit audit events with actor/timestamp/action.
2. Filter query returns expected event subsets.

E2E:
1. Perform draft/edit/review/approve actions.
2. Verify activity feed shows complete trail with filters.

### Module G: Brand and Title Consistency
Unit/Static:
1. Route metadata title generator uses Gundert Editor prefix.
2. Brand constants centralized and reused.

Integration:
1. All layout shells render consistent brand header.

E2E:
1. Validate page titles include Gundert Editor on all primary routes.
2. Validate no legacy brand strings are visible.

## Acceptance Evidence Checklist
1. Test run outputs for unit/integration/e2e.
2. UI screenshots for critical states:
   - chunk selection
   - AI generating
   - partial success + retry
   - unsaved warning
   - blocked approval
3. Brand/title consistency report.

## Minimum Gate to Merge
1. Critical path tests pass for modules A-D.
2. No failing tests in brand/title consistency checks.
3. E2E happy-path workflow passes.
4. Known non-critical failures documented with owner and ETA.
