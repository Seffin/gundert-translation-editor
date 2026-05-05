import { browser } from '$app/environment';
import type { EditorSegment } from '$lib/server/editor';

export type PersistedDraftSegment = {
	targetText: string;
	savedByActorId: string;
	savedAtIso: string;
};

export type PersistedStoryDraft = {
	storyId: string;
	savedByActorId: string;
	savedAtIso: string;
	segments: Record<string, PersistedDraftSegment>;
};

export function draftStorageKey(storyId: string): string {
	return `gundert-editor:draft:${storyId}`;
}

export function buildPersistedStoryDraft(
	storyId: string,
	actorId: string,
	segments: EditorSegment[],
	nowIso: string
): PersistedStoryDraft {
	const persistedSegments: Record<string, PersistedDraftSegment> = {};

	for (const segment of segments) {
		persistedSegments[segment.id] = {
			targetText: segment.targetText,
			savedByActorId: actorId,
			savedAtIso: nowIso
		};
	}

	return {
		storyId,
		savedByActorId: actorId,
		savedAtIso: nowIso,
		segments: persistedSegments
	};
}

export function applyPersistedStoryDraft(
	segments: EditorSegment[],
	persistedDraft: PersistedStoryDraft
): EditorSegment[] {
	return segments.map((segment) => {
		const persisted = persistedDraft.segments[segment.id];
		if (!persisted) return segment;

		return {
			...segment,
			targetText: persisted.targetText,
			lastSavedByActorId: persisted.savedByActorId,
			lastSavedAtIso: persisted.savedAtIso
		};
	});
}

export function hasUnsavedChanges(
	segments: EditorSegment[],
	lastSavedDraft?: PersistedStoryDraft
): boolean {
	if (!lastSavedDraft) {
		return segments.some((segment) => segment.targetText.trim().length > 0);
	}

	for (const segment of segments) {
		const persisted = lastSavedDraft.segments[segment.id];
		if (!persisted && segment.targetText.trim().length > 0) {
			return true;
		}
		if (persisted && persisted.targetText !== segment.targetText) {
			return true;
		}
	}

	return false;
}

export function loadPersistedStoryDraft(storyId: string): PersistedStoryDraft | undefined {
	if (!browser) return undefined;

	try {
		const raw = localStorage.getItem(draftStorageKey(storyId));
		if (!raw) return undefined;

		const parsed = JSON.parse(raw) as PersistedStoryDraft;
		if (parsed.storyId !== storyId || !parsed.segments) return undefined;
		return parsed;
	} catch {
		return undefined;
	}
}

export function savePersistedStoryDraft(draft: PersistedStoryDraft): void {
	if (!browser) return;

	try {
		localStorage.setItem(draftStorageKey(draft.storyId), JSON.stringify(draft));
	} catch {
		// Ignore storage failures in restricted browser contexts.
	}
}
