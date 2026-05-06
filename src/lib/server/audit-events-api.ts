import {
	createAuditEventWriter,
	emitDraftAuditEvent,
	emitEditAuditEvent,
	emitReviewAuditEvent,
	emitApproveAuditEvent,
	type DraftAuditInput,
	type EditAuditInput,
	type ReviewAuditInput,
	type ApproveAuditInput
} from '$lib/server/audit-events';
import { emitAuditEventToStore } from '$lib/server/audit-store';

/**
 * Emit a draft event to the persistent store.
 * Called when AI generates translations or translator initiates drafts.
 */
export function emitStoryDraftEvent(input: DraftAuditInput): void {
	const writer = createAuditEventWriter();
	const event = emitDraftAuditEvent(writer, input, new Date().toISOString());
	emitAuditEventToStore(event);
}

/**
 * Emit an edit event to the persistent store.
 * Called when translator edits a segment.
 */
export function emitStoryEditEvent(input: EditAuditInput): void {
	const writer = createAuditEventWriter();
	const event = emitEditAuditEvent(writer, input, new Date().toISOString());
	emitAuditEventToStore(event);
}

/**
 * Emit a review event to the persistent store.
 * Called when reviewer completes review on a story.
 */
export function emitStoryReviewEvent(input: ReviewAuditInput): void {
	const writer = createAuditEventWriter();
	const event = emitReviewAuditEvent(writer, input, new Date().toISOString());
	emitAuditEventToStore(event);
}

/**
 * Emit an approval event to the persistent store.
 * Called when project lead approves a story.
 */
export function emitStoryApprovalEvent(input: ApproveAuditInput): void {
	const writer = createAuditEventWriter();
	const event = emitApproveAuditEvent(writer, input, new Date().toISOString());
	emitAuditEventToStore(event);
}
