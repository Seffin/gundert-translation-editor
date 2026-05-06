import type { AuditEvent } from '$lib/server/audit-events';

export type AuditStore = {
	add: (event: AuditEvent) => void;
	list: () => AuditEvent[];
};

let globalEvents: AuditEvent[] = [];

export function createAuditStore(): AuditStore {
	return {
		add(event: AuditEvent) {
			globalEvents = [...globalEvents, { ...event, context: { ...event.context } }];
		},
		list() {
			return globalEvents.map((event) => ({ ...event, context: { ...event.context } }));
		}
	};
}

const GLOBAL_STORE = createAuditStore();

export function emitAuditEventToStore(event: AuditEvent): void {
	GLOBAL_STORE.add(event);
}

export function listAuditEventsFromStore(): AuditEvent[] {
	return GLOBAL_STORE.list();
}

export function clearAuditStore(): void {
	globalEvents = [];
}
