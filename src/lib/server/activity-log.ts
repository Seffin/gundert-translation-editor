import {
	buildDemoActivityEvents,
	classifyEventActorType,
	filterActivityEvents,
	type ActivityEvent,
	type ActivityLogFilter
} from '$lib/activity-log';
import { listAuditEventsFromStore } from '$lib/server/audit-store';

export { classifyEventActorType, filterActivityEvents, type ActivityEvent, type ActivityLogFilter };

/**
 * Get real persisted activity events from the audit store.
 * Falls back to demo events if store is empty (for development/testing).
 */
export function getActivityEvents(): ActivityEvent[] {
	const stored = listAuditEventsFromStore();
	return stored.length > 0
		? stored.map((event) => ({
				eventId: event.eventId,
				action: event.action,
				actorId: event.actorId,
				storyId: event.storyId,
				segmentId: event.segmentId,
				createdAtIso: event.createdAtIso,
				payload: event.context
			}))
		: buildDemoActivityEvents();
}
