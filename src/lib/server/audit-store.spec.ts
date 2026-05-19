import { describe, expect, it, beforeEach } from 'vitest';
import {
	createAuditStore,
	emitAuditEventToStore,
	listAuditEventsFromStore,
	clearAuditStore
} from '$lib/server/audit-store';
import {
	createAuditEventWriter,
	emitDraftAuditEvent,
	emitEditAuditEvent
} from '$lib/server/audit-events';

describe('audit event store', () => {
	beforeEach(() => {
		clearAuditStore();
	});

	it('creates an audit store that accepts and lists events', () => {
		const store = createAuditStore();
		const writer = createAuditEventWriter();

		const event = emitDraftAuditEvent(
			writer,
			{
				actorId: 'gemini.ai',
				storyId: '01',
				draftScope: 'whole-story'
			},
			'2026-05-06T10:00:00.000Z'
		);

		store.add(event);
		const events = store.list();

		expect(events).toHaveLength(1);
		expect(events[0].action).toBe('draft');
		expect(events[0].actorId).toBe('gemini.ai');
	});

	it('emits draft event to global store', () => {
		const writer = createAuditEventWriter();
		emitDraftAuditEvent(
			writer,
			{
				actorId: 'translator.demo',
				storyId: '02',
				draftScope: 'selected-chunk'
			},
			'2026-05-06T10:01:00.000Z'
		);

		emitAuditEventToStore(writer.list()[0]);
		const allEvents = listAuditEventsFromStore();

		expect(allEvents).toHaveLength(1);
		expect(allEvents[0].storyId).toBe('02');
	});

	it('persists events across multiple operations', () => {
		const writer1 = createAuditEventWriter();
		emitDraftAuditEvent(writer1, {
			actorId: 'gemini.ai',
			storyId: '01',
			draftScope: 'whole-story'
		});
		emitAuditEventToStore(writer1.list()[0]);

		const writer2 = createAuditEventWriter();
		emitEditAuditEvent(writer2, {
			actorId: 'translator.demo',
			storyId: '01',
			segmentId: '01:02'
		});
		emitAuditEventToStore(writer2.list()[0]);

		const allEvents = listAuditEventsFromStore();
		expect(allEvents).toHaveLength(2);
		expect(allEvents[0].action).toBe('draft');
		expect(allEvents[1].action).toBe('edit');
	});

	it('clears all events from the store', () => {
		const writer = createAuditEventWriter();
		emitDraftAuditEvent(writer, {
			actorId: 'gemini.ai',
			storyId: '01',
			draftScope: 'whole-story'
		});
		emitAuditEventToStore(writer.list()[0]);

		expect(listAuditEventsFromStore()).toHaveLength(1);
		clearAuditStore();
		expect(listAuditEventsFromStore()).toHaveLength(0);
	});
});
