<script lang="ts">
	import type { StoryEditorModel } from '$lib/server/editor';

	let { story } = $props<{ story: StoryEditorModel }>();
</script>

<main class="editor">
	<header>
		<nav aria-label="breadcrumbs">Open Bible Stories / Story {story.storyId}</nav>
		<h1>{story.storyId}: {story.title}</h1>
		<p>{story.description}</p>
	</header>

	<section class="editor-grid" aria-label="source-target-editor">
		{#each story.segments as segment, index}
			<div class="segment-row" data-segment={segment.id}>
				<section class="source-column" aria-label={`source-${segment.id}`}>
					<span class="segment-number">{String(index + 1).padStart(2, '0')}</span>
					<p>{segment.sourceText}</p>
				</section>

				<section class="target-column" aria-label={`target-${segment.id}`}>
					<div class="target-meta">
						<span class="language-chip">{segment.targetLanguage}</span>
						<span class="status-chip">{segment.status}</span>
					</div>
					<textarea rows="4" placeholder="Start translating or use AI draft..." value={segment.targetText}></textarea>
					{#if segment.draftedByGemini}
						<div class="provenance">DRAFTED BY GEMINI • {segment.updatedAtLabel}</div>
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

	.provenance {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #4b5563;
		font-weight: 700;
	}

	@media (max-width: 900px) {
		.segment-row {
			grid-template-columns: 1fr;
		}
	}
</style>
