import type { ObsSegment, ObsStory } from '$lib/server/obs';

/**
 * Represents a single segment in the story editor with source and target text.
 * Tracks translation status, AI provenance, and save history.
 */
export type EditorSegment = {
	id: string;
	sourceText: string;
	targetText: string;
	targetLanguage: string;
	status: 'Draft' | 'Done';
	draftedByGemini: boolean;
	updatedAtLabel: string;
	aiProvenance?: AIDraftProvenance;
	lastSavedByActorId?: string;
	lastSavedAtIso?: string;
};

/**
 * The scope of an AI-generated draft - either the whole story or a selected chunk.
 */
export type AIDraftScope = 'whole-story' | 'selected-chunk';

/**
 * Metadata tracking the provenance of AI-generated translations.
 * Records which AI actor generated the draft and when.
 */
export type AIDraftProvenance = {
	actor: string;
	scope: AIDraftScope;
	generatedAtIso: string;
	generatedAtLabel: string;
};

/**
 * The complete data model for the story editor interface.
 * Contains story metadata and all editable segments.
 */
export type StoryEditorModel = {
	storyId: string;
	storyNumber: number;
	title: string;
	description: string;
	targetLanguage: string;
	segments: EditorSegment[];
};

/**
 * Derives the initial status for a segment based on its index.
 * First two segments are marked as 'Done' for demo purposes.
 * @param segmentIndex - The index of the segment in the story
 * @returns The initial status ('Draft' or 'Done')
 */
function deriveStatus(segmentIndex: number): 'Draft' | 'Done' {
	return segmentIndex < 2 ? 'Done' : 'Draft';
}

/**
 * Derives a human-readable timestamp label for AI-generated segments.
 * Used for demo purposes to show relative time.
 * @param segmentIndex - The index of the segment
 * @returns A human-readable timestamp label
 */
function deriveGeminiLabel(segmentIndex: number): string {
	if (segmentIndex === 0) return '2 mins ago';
	if (segmentIndex === 1) return '5 mins ago';
	return 'Not generated';
}

/**
 * Derives an ISO timestamp for AI-generated segments.
 * Used for demo purposes to provide consistent timestamps.
 * @param segmentIndex - The index of the segment
 * @returns An ISO 8601 timestamp string
 */
function deriveGeminiIso(segmentIndex: number): string {
	if (segmentIndex === 0) return '2026-05-05T09:58:00.000Z';
	if (segmentIndex === 1) return '2026-05-05T09:55:00.000Z';
	return '2026-05-05T09:50:00.000Z';
}

/**
 * Maps an OBS segment to an editor segment with initial state.
 * Sets up status, AI provenance, and timestamps for demo purposes.
 * @param segment - The original OBS segment
 * @param index - The segment index in the story
 * @param targetLanguage - The target language for translation
 * @returns An editor segment ready for the UI
 */
function mapSegment(segment: ObsSegment, index: number, targetLanguage: string): EditorSegment {
	const status = deriveStatus(index);
	const draftedByGemini = status === 'Done';
	const updatedAtLabel = deriveGeminiLabel(index);
	return {
		id: segment.id,
		sourceText: segment.text,
		targetText: '',
		targetLanguage,
		status,
		draftedByGemini,
		updatedAtLabel,
		aiProvenance: draftedByGemini
			? {
					actor: 'Gemini',
					scope: 'whole-story',
					generatedAtIso: deriveGeminiIso(index),
					generatedAtLabel: updatedAtLabel
				}
			: undefined,
		lastSavedByActorId: undefined,
		lastSavedAtIso: undefined
	};
}

/**
 * Default target language for new stories when no preference is set.
 */
export const DEFAULT_STORY_LANGUAGE = 'Hindi';

/**
 * Builds the complete story editor model from an OBS story.
 * Maps all segments and sets up initial state for the editor interface.
 * @param story - The OBS story to convert
 * @param targetLanguage - The target language for translation (defaults to Hindi)
 * @returns A complete story editor model ready for the UI
 */
export function buildStoryEditorModel(
	story: ObsStory,
	targetLanguage: string = DEFAULT_STORY_LANGUAGE
): StoryEditorModel {
	return {
		storyId: story.storyId,
		storyNumber: story.storyNumber,
		title: story.title,
		description: `Story ${story.storyId} baseline editor view for source and target translation.`,
		targetLanguage,
		segments: story.segments.map((segment, index) => mapSegment(segment, index, targetLanguage))
	};
}
