import { describe, expect, it } from 'vitest';
import type { EditorSegment } from '$lib/server/editor';
import {
	applyPersistedStoryDraft,
	buildPersistedStoryDraft,
	draftStorageKey,
	hasUnsavedChanges
} from '$lib/client/story-editor-draft';

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

describe('story editor draft persistence', () => {
	it('builds persisted draft with actor and timestamp metadata', () => {
		const draft = buildPersistedStoryDraft('01', 'translator.demo', SEGMENTS, '2026-05-05T10:00:00.000Z');

		expect(draft.storyId).toBe('01');
		expect(draft.savedByActorId).toBe('translator.demo');
		expect(draft.segments['01:01'].savedAtIso).toBe('2026-05-05T10:00:00.000Z');
	});

	it('applies persisted draft to editor segments', () => {
		const draft = buildPersistedStoryDraft('01', 'translator.demo', SEGMENTS, '2026-05-05T10:00:00.000Z');
		const applied = applyPersistedStoryDraft(
			[
				{
					...SEGMENTS[0],
					targetText: ''
				}
			],
			draft
		);

		expect(applied[0].targetText).toBe('Target 1');
		expect(applied[0].lastSavedByActorId).toBe('translator.demo');
	});

	it('builds stable storage key format', () => {
		expect(draftStorageKey('01')).toBe('gundert-editor:draft:01');
	});

	it('detects unsaved changes relative to last saved draft', () => {
		const draft = buildPersistedStoryDraft('01', 'translator.demo', SEGMENTS, '2026-05-05T10:00:00.000Z');
		expect(hasUnsavedChanges(SEGMENTS, draft)).toBe(false);

		const edited = [{ ...SEGMENTS[0], targetText: 'Changed target' }, SEGMENTS[1]];
		expect(hasUnsavedChanges(edited, draft)).toBe(true);
	});

	it('treats non-empty content as unsaved when no prior draft exists', () => {
		expect(hasUnsavedChanges(SEGMENTS, undefined)).toBe(true);
		expect(
			hasUnsavedChanges(
				SEGMENTS.map((segment) => ({ ...segment, targetText: '' })),
				undefined
			)
		).toBe(false);
	});
});
