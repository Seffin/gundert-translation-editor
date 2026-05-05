<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import {
		applyPersistedStoryDraft,
		buildPersistedStoryDraft,
		hasUnsavedChanges,
		loadPersistedStoryDraft,
		savePersistedStoryDraft,
		type PersistedStoryDraft
	} from '$lib/client/story-editor-draft';
	import { confirmDiscardChanges } from '$lib/client/route-leave-guard';
	import {
		buildSegmentSelectionModel,
		toggleSegmentSelection,
		requestGeminiChunkDraft,
		type SegmentSelectionModel
	} from '$lib/client/gemini-chunk';
	import {
		loadTargetLanguage,
		saveTargetLanguage
	} from '$lib/client/target-language';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import type { StoryEditorModel } from '$lib/server/editor';

	const ACTOR_ID = 'translator.demo';

	let { story } = $props<{ story: StoryEditorModel }>();
	function createInitialSegments() {
		return story.segments.map((segment) => ({ ...segment }));
	}

	let editorSegments = $state(createInitialSegments());
	let isDirty = $state(false);
	let saveMessage = $state('');
	let saving = $state(false);
	let lastSavedDraft = $state<PersistedStoryDraft | undefined>(undefined);
	let selection = $state<SegmentSelectionModel>(buildSegmentSelectionModel(createInitialSegments()));
	let drafting = $state(false);
	let draftError = $state('');
	let selectedLanguage = $state((() => story.targetLanguage)());

	onMount(() => {
		selectedLanguage = loadTargetLanguage(story.storyId);
		const persisted = loadPersistedStoryDraft(story.storyId);
		if (!persisted) return;

		editorSegments = applyPersistedStoryDraft(editorSegments, persisted);
		lastSavedDraft = persisted;
		saveMessage = `Saved by ${persisted.savedByActorId} at ${persisted.savedAtIso}`;
		isDirty = false;

		// Set up beforeunload handler for browser tab/window close
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty && hasUnsavedChanges(editorSegments, lastSavedDraft)) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	beforeNavigate(async (navigation) => {
		if (!isDirty || !hasUnsavedChanges(editorSegments, lastSavedDraft)) {
			return;
		}

		const allowed = await confirmDiscardChanges(editorSegments, lastSavedDraft);
		if (!allowed) {
			navigation.cancel();
		}
	});

	function markDirty(): void {
		isDirty = hasUnsavedChanges(editorSegments, lastSavedDraft);
		if (isDirty) saveMessage = '';
	}

	function toggleSegment(id: string): void {
		selection = toggleSegmentSelection(selection, id);
	}

	function toggleAllSegments(): void {
		if (editorSegments.length === 0) return;

		const shouldSelectAll = selection.count !== editorSegments.length;
		const selected: Record<string, boolean> = {};

		for (const segment of editorSegments) {
			selected[segment.id] = shouldSelectAll;
		}

		selection = {
			selected,
			count: shouldSelectAll ? editorSegments.length : 0
		};
	}

	function handleLanguageChange(lang: string): void {
		selectedLanguage = lang;
		saveTargetLanguage(story.storyId, lang);
		editorSegments = editorSegments.map((s) => ({ ...s, targetLanguage: lang }));
	}

	function formatProvenanceScope(scope: string): string {
		if (scope === 'whole-story') return 'Whole story';
		if (scope === 'selected-chunk') return 'Selected chunk';
		return scope;
	}

	async function draftSelected(): Promise<void> {
		if (selection.count === 0 || drafting) return;
		drafting = true;
		draftError = '';
		try {
			const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) ?? '';
			editorSegments = await requestGeminiChunkDraft(
				editorSegments,
				selection,
				selectedLanguage,
				story.storyId,
				apiKey
			);
			isDirty = true;
			saveMessage = '';
			selection = buildSegmentSelectionModel(editorSegments);
		} catch (err) {
			draftError = err instanceof Error ? err.message : 'Draft failed';
		} finally {
			drafting = false;
		}
	}

	function saveChanges(): void {
		saving = true;
		const nowIso = new Date().toISOString();
		const draft = buildPersistedStoryDraft(story.storyId, ACTOR_ID, editorSegments, nowIso);
		savePersistedStoryDraft(draft);

		editorSegments = editorSegments.map((segment) => ({
			...segment,
			lastSavedByActorId: ACTOR_ID,
			lastSavedAtIso: nowIso
		}));

		lastSavedDraft = draft;
		isDirty = false;
		saveMessage = `Saved by ${ACTOR_ID} at ${nowIso}`;
		saving = false;
	}
</script>

<main class="editor">
	<header>
		<nav aria-label="breadcrumbs">Open Bible Stories / Story {story.storyId}</nav>
		<h1>{story.storyId}: {story.title}</h1>
		<p>{story.description}</p>
		<div class="save-bar">
			<LanguageSelector storyId={story.storyId} value={selectedLanguage} onchange={handleLanguageChange} />
			<button
				type="button"
				class="bulk-select-btn"
				onclick={toggleAllSegments}
				disabled={editorSegments.length === 0}
				data-testid="bulk-select-btn"
			>
				{selection.count === editorSegments.length && editorSegments.length > 0
					? 'Deselect All'
					: 'Select All'}
			</button>
			<button onclick={saveChanges} disabled={!isDirty || saving}>
				{saving ? 'Saving...' : 'Save Changes'}
			</button>
			<button
				class="draft-btn"
				onclick={draftSelected}
				disabled={selection.count === 0 || drafting}
				data-testid="draft-selected-btn"
			>
				{drafting ? 'Drafting…' : `Draft Selected (${selection.count})`}
			</button>
			{#if isDirty}
				<span class="dirty-indicator">Unsaved changes</span>
			{/if}
			{#if saveMessage}
				<span class="save-message" data-testid="save-message">{saveMessage}</span>
			{/if}
			{#if draftError}
				<span class="draft-error" data-testid="draft-error">{draftError}</span>
			{/if}
		</div>
	</header>

	<section class="editor-grid" aria-label="source-target-editor">
		{#each editorSegments as segment, index (segment.id)}
			<div class="segment-row" data-segment={segment.id}>
				<section class="source-column" aria-label={`source-${segment.id}`}>
					<div class="segment-header">
						<span class="segment-number">{String(index + 1).padStart(2, '0')}</span>
						<label class="select-label">
							<input
								type="checkbox"
								checked={selection.selected[segment.id]}
								onchange={() => toggleSegment(segment.id)}
								aria-label={`select-segment-${segment.id}`}
							/>
							Select
						</label>
					</div>
					<p>{segment.sourceText}</p>
				</section>

				<section class="target-column" aria-label={`target-${segment.id}`}>
					<div class="target-meta">
						<span class="language-chip">{segment.targetLanguage}</span>
						<span class="status-chip">{segment.status}</span>
					</div>
					{#if drafting && selection.selected[segment.id]}
						<div class="skeleton" aria-label="generating draft" data-testid="skeleton-{segment.id}">
							<div class="skeleton-line"></div>
							<div class="skeleton-line skeleton-line--short"></div>
							<div class="skeleton-line"></div>
						</div>
					{:else}
						<textarea
							rows="4"
							placeholder="Start translating or use AI draft..."
							bind:value={segment.targetText}
							oninput={markDirty}
							aria-label={`target-${segment.id}`}
						></textarea>
					{/if}
					{#if segment.draftedByGemini && segment.aiProvenance}
						<div class="provenance">
							AI DRAFT • {segment.aiProvenance.actor} • {formatProvenanceScope(segment.aiProvenance.scope)} • {segment.aiProvenance.generatedAtLabel}
						</div>
					{:else if segment.draftedByGemini}
						<div class="provenance">AI DRAFT • Gemini • Whole story • {segment.updatedAtLabel}</div>
					{/if}
					{#if segment.lastSavedByActorId}
						<div class="save-meta">Saved by {segment.lastSavedByActorId} at {segment.lastSavedAtIso}</div>
					{/if}
				</section>
			</div>
		{/each}
	</section>
</main>

<style>
	.editor {
		padding: 2rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	.save-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-top: 0.75rem;
	}

	button {
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		border: 1px solid #111827;
		background: #111827;
		color: #fff;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.draft-btn {
		background: #1f4f3f;
		border-color: #1f4f3f;
	}

	.bulk-select-btn {
		background: #374151;
		border-color: #374151;
	}

	.dirty-indicator {
		font-size: 0.8rem;
		font-weight: 700;
		color: #7a1f1a;
	}

	.save-message {
		font-size: 0.8rem;
		font-weight: 700;
		color: #1f4f3f;
	}

	.draft-error {
		font-size: 0.8rem;
		font-weight: 700;
		color: #7a1f1a;
	}

	.segment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.select-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		color: #4b5563;
	}

	.editor-grid {
		display: grid;
		gap: 2rem;
	}

	.segment-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.source-column,
	.target-column {
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 0.75rem;
	}

	.segment-number {
		font-size: 0.75rem;
		font-weight: 700;
		color: #6b7280;
	}

	.target-meta {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.language-chip,
	.status-chip {
		font-size: 0.75rem;
		font-weight: 700;
	}

	textarea {
		width: 100%;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0;
	}

	.skeleton-line {
		height: 1rem;
		border-radius: 0.25rem;
		background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-line--short {
		width: 60%;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.provenance {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #4b5563;
		font-weight: 700;
	}

	.save-meta {
		margin-top: 0.35rem;
		font-size: 0.7rem;
		color: #1f4f3f;
		font-weight: 600;
	}

	@media (max-width: 900px) {
		.segment-row {
			grid-template-columns: 1fr;
		}
	}
</style>
