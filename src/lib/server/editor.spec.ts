import { describe, expect, it } from 'vitest';
import type { ObsStory } from '$lib/server/obs';
import { buildStoryEditorModel } from '$lib/server/editor';

function makeStory(): ObsStory {
	return {
		storyNumber: 1,
		storyId: '01',
		title: 'The Creation',
		segments: [
			{ id: '01:01', text: 'In the beginning, God created the heavens and the earth.' },
			{ id: '01:02', text: 'And God said, "Let there be light," and there was light.' },
			{ id: '01:03', text: 'ദൈവം അരുളിച്ചെയ്തു: "വെളിച്ചം ഉണ്ടാകട്ടെ".' }
		]
	};
}

describe('story editor model', () => {
	it('maps story and segments into editor model shape', () => {
		const model = buildStoryEditorModel(makeStory());

		expect(model.storyId).toBe('01');
		expect(model.title).toBe('The Creation');
		expect(model.segments).toHaveLength(3);
		expect(model.segments[0].id).toBe('01:01');
	});

	it('preserves unicode source text for Indic scripts', () => {
		const model = buildStoryEditorModel(makeStory());
		expect(model.segments[2].sourceText).toContain('വെളിച്ചം');
	});

	it('marks first segments as done with Gemini provenance labels', () => {
		const model = buildStoryEditorModel(makeStory());
		expect(model.segments[0].status).toBe('Done');
		expect(model.segments[0].draftedByGemini).toBe(true);
		expect(model.segments[0].updatedAtLabel).toContain('mins ago');
		expect(model.segments[2].status).toBe('Draft');
	});

	it('uses Hindi as the default story-level target language', () => {
		const model = buildStoryEditorModel(makeStory());
		expect(model.targetLanguage).toBe('Hindi');
		expect(model.segments[0].targetLanguage).toBe('Hindi');
		expect(model.segments[1].targetLanguage).toBe('Hindi');
	});

	it('propagates an explicit target language to all segments', () => {
		const model = buildStoryEditorModel(makeStory(), 'Tamil');
		expect(model.targetLanguage).toBe('Tamil');
		expect(model.segments[0].targetLanguage).toBe('Tamil');
		expect(model.segments[2].targetLanguage).toBe('Tamil');
	});
});
