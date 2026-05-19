export type AuditAction = 'draft' | 'edit' | 'review' | 'approve';

export type ActivityEvent = {
	eventId: string;
	action: AuditAction;
	actorId: string;
	storyId: string;
	segmentId?: string;
	createdAtIso: string;
	payload: Record<string, unknown>;
};

export type ActivityEventActorType = 'AI' | 'Human';

export type ActivityLogFilter = {
	actorId: string;
	action: AuditAction | 'all';
	dateRange: 'all' | 'last-7-days' | 'last-30-days';
};

export function classifyEventActorType(event: ActivityEvent): ActivityEventActorType {
	return event.actorId.toLowerCase().includes('gemini') ? 'AI' : 'Human';
}

function daysBetween(laterIso: string, earlierIso: string): number {
	const later = new Date(laterIso).getTime();
	const earlier = new Date(earlierIso).getTime();
	return (later - earlier) / (1000 * 60 * 60 * 24);
}

function matchesDateRange(
	event: ActivityEvent,
	range: ActivityLogFilter['dateRange'],
	nowIso: string
): boolean {
	if (range === 'all') return true;
	const ageDays = daysBetween(nowIso, event.createdAtIso);
	if (range === 'last-7-days') return ageDays <= 7;
	if (range === 'last-30-days') return ageDays <= 30;
	return true;
}

export function filterActivityEvents(
	events: ActivityEvent[],
	filter: ActivityLogFilter,
	nowIso: string = new Date().toISOString()
): ActivityEvent[] {
	return events.filter((event) => {
		const actorMatch = filter.actorId === 'all' || event.actorId === filter.actorId;
		const actionMatch = filter.action === 'all' || event.action === filter.action;
		const dateMatch = matchesDateRange(event, filter.dateRange, nowIso);
		return actorMatch && actionMatch && dateMatch;
	});
}

export function buildDemoActivityEvents(): ActivityEvent[] {
	return [
		{
			eventId: 'audit-0001',
			action: 'draft',
			actorId: 'gemini.ai',
			storyId: '01',
			createdAtIso: '2026-05-01T08:00:00.000Z',
			payload: {
				draftScope: 'whole-story'
			}
		},
		{
			eventId: 'audit-0002',
			action: 'edit',
			actorId: 'translator.demo',
			storyId: '01',
			segmentId: '01:02',
			createdAtIso: '2026-05-05T09:15:00.000Z',
			payload: {
				segmentId: '01:02'
			}
		},
		{
			eventId: 'audit-0003',
			action: 'review',
			actorId: 'reviewer.demo',
			storyId: '01',
			createdAtIso: '2026-05-06T08:20:00.000Z',
			payload: {
				decision: 'resolved'
			}
		},
		{
			eventId: 'audit-0004',
			action: 'approve',
			actorId: 'lead.demo',
			storyId: '01',
			createdAtIso: '2026-05-06T09:30:00.000Z',
			payload: {}
		}
	];
}
