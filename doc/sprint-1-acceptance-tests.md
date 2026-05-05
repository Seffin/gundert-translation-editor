# Sprint 1 Acceptance Tests (TDD, No Implementation Yet)

## Scope
These acceptance tests define expected behavior for Sprint 1 must-ship features.

## Story 1: OBS Text Ingestion and Story Rendering
Given a valid OBS source package
When a project lead imports the package
Then stories are listed in canonical order
And each story can be opened in the editor workspace
And source segments are preserved in stable order

Pass evidence:
1. Import report showing story count
2. UI proof for story list and story open flow
3. Segment order verification artifact

## Story 2: Whole-Story Gemini Draft Generation (Optional Chunk Mode)
Given a source OBS story with preserved segment boundaries
When a translator requests AI drafting in whole-story mode
Then the system generates a full-story target draft
And returns mapped output per segment for editing
And marks all generated segments as AI-drafted

Given a source OBS story
When a translator requests AI drafting in chunk mode
Then the system generates draft output only for selected chunk(s)
And does not overwrite unselected segments

Pass evidence:
1. Request/response artifact for whole-story mode
2. Request/response artifact for chunk mode
3. Mapping verification between generated text and segment structure

## Story 3: Editor Save States for Translator
Given a translator edits one or more target segments
When the translator saves changes
Then edits persist with timestamp and actor identity
And unsaved changes are clearly indicated before save

Pass evidence:
1. Before/after edit artifact
2. Persistence proof after reload
3. Save-state UI proof

## Story 4: Role Gating and Status Transitions
Given role assignments for Translator, Reviewer, and Project Lead
When a user attempts a restricted action outside role permissions
Then the action is blocked with clear feedback

Given a segment in Draft state
When valid workflow actions are taken
Then status transitions follow the allowed path:
Draft -> In Review -> Approved

Pass evidence:
1. Permission matrix test artifact
2. Transition path artifact with invalid-path rejection

## Story 5: Minimal Audit Trail Per Segment Action
Given any segment action (AI draft, edit, comment, status change)
When the action is completed
Then an audit record is created with actor, timestamp, action type, and context
And records are visible in a segment history view

Pass evidence:
1. Audit log artifacts for each action type
2. Segment history UI proof

## Cross-Cutting Acceptance Conditions
1. Unicode-safe rendering in selected Latin and Indic pilot scripts
2. No automatic final approval without explicit human action
3. All AI-generated content is visibly labeled as AI-originated

Pass evidence:
1. Script rendering screenshots for pilot languages
2. Workflow proof that approval is human-triggered
3. Labeling proof in editor and history views

## Definition of Done for Sprint 1
1. All acceptance tests have explicit pass artifacts
2. No must-ship story remains without evidence
3. Facilitator confirms reviewability of outputs
4. Team encodes decisions and unresolved opens in oddkit workflow
