export type AuditAction = 'draft' | 'edit' | 'review' | 'approve';

export type AuditEvent = {
	eventId: string;
	action: AuditAction;
	actorId: string;
	storyId: string;
	segmentId?: string;
	createdAtIso: string;
	context: Record<string, string>;
};

export type AuditEventInput = {
	action: AuditAction;
	actorId: string;
	storyId: string;
	segmentId?: string;
	context?: Record<string, string>;
};

export type AuditEventWriter = {
	write: (input: AuditEventInput, createdAtIso?: string) => AuditEvent;
	list: () => AuditEvent[];
};

function buildEventId(sequence: number): string {
	return `audit-${String(sequence).padStart(4, '0')}`;
}

export function createAuditEventWriter(seed: AuditEvent[] = []): AuditEventWriter {
	let events = seed.map((event) => ({ ...event, context: { ...event.context } }));
	let sequence = events.length;

	function write(input: AuditEventInput, createdAtIso: string = new Date().toISOString()): AuditEvent {
		sequence += 1;
		const event: AuditEvent = {
			eventId: buildEventId(sequence),
			action: input.action,
			actorId: input.actorId,
			storyId: input.storyId,
			segmentId: input.segmentId,
			createdAtIso,
			context: { ...(input.context ?? {}) }
		};
		events = [...events, event];
		return event;
	}

	function list(): AuditEvent[] {
		return events.map((event) => ({ ...event, context: { ...event.context } }));
	}

	return {
		write,
		list
	};
}

export type DraftAuditInput = {
	actorId: string;
	storyId: string;
	draftScope: 'whole-story' | 'selected-chunk';
};

export type EditAuditInput = {
	actorId: string;
	storyId: string;
	segmentId: string;
};

export type ReviewAuditInput = {
	actorId: string;
	storyId: string;
	decision: 'return-to-draft' | 'resolved';
};

export type ApproveAuditInput = {
	actorId: string;
	storyId: string;
};

export function emitDraftAuditEvent(
	writer: AuditEventWriter,
	input: DraftAuditInput,
	createdAtIso?: string
): AuditEvent {
	return writer.write(
		{
			action: 'draft',
			actorId: input.actorId,
			storyId: input.storyId,
			context: {
				draftScope: input.draftScope
			}
		},
		createdAtIso
	);
}

export function emitEditAuditEvent(
	writer: AuditEventWriter,
	input: EditAuditInput,
	createdAtIso?: string
): AuditEvent {
	return writer.write(
		{
			action: 'edit',
			actorId: input.actorId,
			storyId: input.storyId,
			segmentId: input.segmentId,
			context: {
				changeType: 'manual-edit'
			}
		},
		createdAtIso
	);
}

export function emitReviewAuditEvent(
	writer: AuditEventWriter,
	input: ReviewAuditInput,
	createdAtIso?: string
): AuditEvent {
	return writer.write(
		{
			action: 'review',
			actorId: input.actorId,
			storyId: input.storyId,
			context: {
				decision: input.decision
			}
		},
		createdAtIso
	);
}

export function emitApproveAuditEvent(
	writer: AuditEventWriter,
	input: ApproveAuditInput,
	createdAtIso?: string
): AuditEvent {
	return writer.write(
		{
			action: 'approve',
			actorId: input.actorId,
			storyId: input.storyId,
			context: {
				decision: 'approved'
			}
		},
		createdAtIso
	);
}
