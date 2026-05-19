import { describe, expect, it, vi } from 'vitest';
import type { EditorSegment } from '$lib/server/editor';
import type { PersistedStoryDraft } from '$lib/client/story-editor-draft';
import { shouldAllowRouteLeave, confirmDiscardChanges } from '$lib/client/route-leave-guard';

const SEGMENTS: EditorSegment[] = [
	{
		id: '01:01',
		sourceText: 'Source 1',
		targetText: 'Target 1',
		targetLanguage: 'Hindi',
		status: 'Done',
		draftedByGemini: true,
		updatedAtLabel: '2 mins ago'
	},
	{
		id: '01:02',
		sourceText: 'Source 2',
		targetText: '',
		targetLanguage: 'Malayalam',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	}
];

const SAVED_DRAFT: PersistedStoryDraft = {
	storyId: '01',
	savedByActorId: 'translator.demo',
	savedAtIso: '2026-05-05T10:00:00.000Z',
	segments: {
		'01:01': {
			targetText: 'Target 1',
			savedByActorId: 'translator.demo',
			savedAtIso: '2026-05-05T10:00:00.000Z'
		},
		'01:02': {
			targetText: '',
			savedByActorId: 'translator.demo',
			savedAtIso: '2026-05-05T10:00:00.000Z'
		}
	}
};

describe('route leave guard', () => {
	it('allows route leave when no unsaved changes exist', () => {
		const result = shouldAllowRouteLeave(SEGMENTS, SAVED_DRAFT);
		expect(result).toBe(true);
	});

	it('blocks route leave when unsaved changes exist and user cancels', async () => {
		const edited = [{ ...SEGMENTS[0], targetText: 'Changed' }, SEGMENTS[1]];
		vi.stubGlobal(
			'confirm',
			vi.fn(() => false)
		);

		const result = await confirmDiscardChanges(edited, SAVED_DRAFT);
		expect(result).toBe(false);
		expect(globalThis.confirm).toHaveBeenCalled();
	});

	it('allows route leave when unsaved changes exist and user confirms', async () => {
		const edited = [{ ...SEGMENTS[0], targetText: 'Changed' }, SEGMENTS[1]];
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		);

		const result = await confirmDiscardChanges(edited, SAVED_DRAFT);
		expect(result).toBe(true);
		expect(globalThis.confirm).toHaveBeenCalled();
	});

	it('allows route leave when no prior saved draft exists and user confirms', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		);

		const result = await confirmDiscardChanges(SEGMENTS, undefined);
		expect(result).toBe(true);
	});

	it('blocks route leave when no prior saved draft and unsaved content exists and user cancels', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => false)
		);

		const result = await confirmDiscardChanges(SEGMENTS, undefined);
		expect(result).toBe(false);
	});

	it('includes actor context in confirmation message', async () => {
		const edited = [{ ...SEGMENTS[0], targetText: 'Changed' }, SEGMENTS[1]];
		const confirmSpy = vi.fn(() => true);
		vi.stubGlobal('confirm', confirmSpy);

		await confirmDiscardChanges(edited, SAVED_DRAFT);

		const message = confirmSpy.mock.calls[0]?.[0] || '';
		expect(message).toMatch(/unsaved changes/i);
		expect(message).toMatch(/discard/i);
	});
});
