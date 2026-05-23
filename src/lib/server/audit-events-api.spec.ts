import { describe, expect, it, beforeEach } from 'vitest';
import {
	emitStoryDraftEvent,
	emitStoryEditEvent,
	emitStoryReviewEvent,
	emitStoryApprovalEvent
} from '$lib/server/audit-events-api';
import { listAuditEventsFromStore, clearAuditStore } from '$lib/server/audit-store';

describe('audit events API', () => {
	beforeEach(() => {
		clearAuditStore();
	});

	it('emits draft event to store with current timestamp', () => {
		emitStoryDraftEvent({
			actorId: 'gemini.ai',
			storyId: '01',
			draftScope: 'whole-story'
		});

		const events = listAuditEventsFromStore();
		expect(events).toHaveLength(1);
		expect(events[0].action).toBe('draft');
		expect(events[0].actorId).toBe('gemini.ai');
		expect(events[0].storyId).toBe('01');
	});

	it('emits edit event to store', () => {
		emitStoryEditEvent({
			actorId: 'translator.demo',
			storyId: '01',
			segmentId: '01:02'
		});

		const events = listAuditEventsFromStore();
		expect(events).toHaveLength(1);
		expect(events[0].action).toBe('edit');
		expect(events[0].segmentId).toBe('01:02');
	});

	it('emits review event to store', () => {
		emitStoryReviewEvent({
			actorId: 'reviewer.demo',
			storyId: '03',
			decision: 'resolved'
		});

		const events = listAuditEventsFromStore();
		expect(events).toHaveLength(1);
		expect(events[0].action).toBe('review');
		expect(events[0].actorId).toBe('reviewer.demo');
	});

	it('emits approval event to store', () => {
		emitStoryApprovalEvent({
			actorId: 'lead.demo',
			storyId: '06'
		});

		const events = listAuditEventsFromStore();
		expect(events).toHaveLength(1);
		expect(events[0].action).toBe('approve');
		expect(events[0].storyId).toBe('06');
	});

	it('chains multiple operations to create audit trail', () => {
		emitStoryDraftEvent({
			actorId: 'gemini.ai',
			storyId: '01',
			draftScope: 'whole-story'
		});
		emitStoryEditEvent({
			actorId: 'translator.demo',
			storyId: '01',
			segmentId: '01:01'
		});
		emitStoryReviewEvent({
			actorId: 'reviewer.demo',
			storyId: '01',
			decision: 'resolved'
		});
		emitStoryApprovalEvent({
			actorId: 'lead.demo',
			storyId: '01'
		});

		const events = listAuditEventsFromStore();
		expect(events).toHaveLength(4);
		expect(events.map((e) => e.action)).toEqual(['draft', 'edit', 'review', 'approve']);
		expect(events.every((e) => e.storyId === '01')).toBe(true);
	});
});
