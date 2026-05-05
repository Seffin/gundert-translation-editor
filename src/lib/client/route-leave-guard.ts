import type { EditorSegment } from '$lib/server/editor';
import type { PersistedStoryDraft } from '$lib/client/story-editor-draft';
import { hasUnsavedChanges } from '$lib/client/story-editor-draft';

export function shouldAllowRouteLeave(
	segments: EditorSegment[],
	lastSavedDraft?: PersistedStoryDraft
): boolean {
	return !hasUnsavedChanges(segments, lastSavedDraft);
}

export async function confirmDiscardChanges(
	segments: EditorSegment[],
	lastSavedDraft?: PersistedStoryDraft
): Promise<boolean> {
	if (!hasUnsavedChanges(segments, lastSavedDraft)) {
		return true;
	}

	const message = 'You have unsaved changes. Discard them?';
	return globalThis.confirm?.(message) ?? false;
}
