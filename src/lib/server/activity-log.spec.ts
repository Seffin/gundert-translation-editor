import { describe, expect, it } from 'vitest';
import {
	classifyEventActorType,
	filterActivityEvents,
	buildDemoActivityEvents,
	type ActivityLogFilter
} from '$lib/activity-log';

describe('activity log domain', () => {
	it('classifies AI and human actors correctly', () => {
		const events = buildDemoActivityEvents();
		const ai = events.find((event) => event.actorId === 'gemini.ai');
		const human = events.find((event) => event.actorId === 'translator.demo');

		expect(ai).toBeDefined();
		expect(human).toBeDefined();
		expect(classifyEventActorType(ai!)).toBe('AI');
		expect(classifyEventActorType(human!)).toBe('Human');
	});

	it('filters events by actor, type, and date range', () => {
		const events = buildDemoActivityEvents();
		const filter: ActivityLogFilter = {
			actorId: 'translator.demo',
			action: 'edit',
			dateRange: 'last-7-days'
		};

		const result = filterActivityEvents(events, filter, '2026-05-06T10:30:00.000Z');

		expect(result).toHaveLength(1);
		expect(result[0].actorId).toBe('translator.demo');
		expect(result[0].action).toBe('edit');
	});

	it('returns all events when filters are set to all', () => {
		const events = buildDemoActivityEvents();
		const result = filterActivityEvents(
			events,
			{
				actorId: 'all',
				action: 'all',
				dateRange: 'all'
			},
			'2026-05-06T10:30:00.000Z'
		);

		expect(result).toHaveLength(events.length);
	});
});
