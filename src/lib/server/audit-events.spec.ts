import { describe, expect, it } from 'vitest';
import {
	createAuditEventWriter,
	emitApproveAuditEvent,
	emitDraftAuditEvent,
	emitEditAuditEvent,
	emitReviewAuditEvent
} from '$lib/server/audit-events';

describe('audit event writer', () => {
	it('emits draft event with actor, timestamp, and draft scope context', () => {
		const writer = createAuditEventWriter();
		const event = emitDraftAuditEvent(
			writer,
			{
				actorId: 'translator.demo',
				storyId: '01',
				draftScope: 'selected-chunk'
			},
			'2026-05-06T10:00:00.000Z'
		);

		expect(event.eventId).toBe('audit-0001');
		expect(event.action).toBe('draft');
		expect(event.actorId).toBe('translator.demo');
		expect(event.storyId).toBe('01');
		expect(event.createdAtIso).toBe('2026-05-06T10:00:00.000Z');
		expect(event.context).toEqual({ draftScope: 'selected-chunk' });
	});

	it('emits edit event with segment context', () => {
		const writer = createAuditEventWriter();
		const event = emitEditAuditEvent(
			writer,
			{
				actorId: 'translator.demo',
				storyId: '01',
				segmentId: '01:02'
			},
			'2026-05-06T10:01:00.000Z'
		);

		expect(event.action).toBe('edit');
		expect(event.segmentId).toBe('01:02');
		expect(event.context).toEqual({ changeType: 'manual-edit' });
	});

	it('emits review event with reviewer decision context', () => {
		const writer = createAuditEventWriter();
		const event = emitReviewAuditEvent(
			writer,
			{
				actorId: 'reviewer.demo',
				storyId: '03',
				decision: 'return-to-draft'
			},
			'2026-05-06T10:02:00.000Z'
		);

		expect(event.action).toBe('review');
		expect(event.actorId).toBe('reviewer.demo');
		expect(event.context).toEqual({ decision: 'return-to-draft' });
	});

	it('emits approve event for lead action', () => {
		const writer = createAuditEventWriter();
		const event = emitApproveAuditEvent(
			writer,
			{
				actorId: 'lead.demo',
				storyId: '06'
			},
			'2026-05-06T10:03:00.000Z'
		);

		expect(event.action).toBe('approve');
		expect(event.actorId).toBe('lead.demo');
		expect(event.storyId).toBe('06');
		expect(event.context).toEqual({ decision: 'approved' });
	});

	it('keeps emitted events in order for downstream activity log consumers', () => {
		const writer = createAuditEventWriter();
		emitDraftAuditEvent(writer, {
			actorId: 'translator.demo',
			storyId: '01',
			draftScope: 'whole-story'
		});
		emitEditAuditEvent(writer, {
			actorId: 'translator.demo',
			storyId: '01',
			segmentId: '01:01'
		});
		emitReviewAuditEvent(writer, {
			actorId: 'reviewer.demo',
			storyId: '01',
			decision: 'resolved'
		});
		emitApproveAuditEvent(writer, {
			actorId: 'lead.demo',
			storyId: '01'
		});

		const events = writer.list();
		expect(events.map((event) => event.action)).toEqual(['draft', 'edit', 'review', 'approve']);
		expect(events.map((event) => event.eventId)).toEqual([
			'audit-0001',
			'audit-0002',
			'audit-0003',
			'audit-0004'
		]);
	});
});
