<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
	let story = $derived(data.story);
	let isPublished = $derived(data.isPublished);
</script>

<svelte:head>
	<title>{story.title} | Published OBS Story</title>
</svelte:head>

<article class="showcase-reader">
	<header class="reader-header">
		<a href="/demo" class="back-link">← Back to Showcase Dashboard</a>
		
		<div class="title-meta">
			<span class="story-badge">Story {story.storyId}</span>
			<h1>{story.title}</h1>
		</div>

		{#if isPublished}
			<div class="status-banner status-banner--published" data-testid="status-published">
				<span class="status-icon">✓</span>
				<div class="status-content">
					<h3>Malayalam Publication Live</h3>
					<p>This story was approved by the Project Lead and is successfully written to <code>ml_obs/content/{story.storyId}.md</code>.</p>
				</div>
			</div>
		{:else}
			<div class="status-banner status-banner--draft" data-testid="status-draft">
				<span class="status-icon">⚠</span>
				<div class="status-content">
					<h3>Preview Mode (English Fallback)</h3>
					<p>The Malayalam translation for this story has not yet been approved. Showing original English text. You can approve this story in the <a href="/lead">Project Lead Approval Gate</a>.</p>
				</div>
			</div>
		{/if}
	</header>

	<main class="story-content">
		{#each story.segments as segment, index}
			<div class="story-row">
				{#if segment.imageUrl}
					<div class="story-illustration-container">
						<img src={segment.imageUrl} alt={`Segment ${index + 1} illustration`} class="story-illustration" />
					</div>
				{/if}
				<div class="story-text-container">
					<span class="segment-marker">Segment {String(index + 1).padStart(2, '0')}</span>
					<p class="story-text">{segment.text}</p>
				</div>
			</div>
		{/each}
	</main>
</article>

<style>
	.showcase-reader {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1.5rem;
	}

	.reader-header {
		margin-bottom: 3rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.back-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.95rem;
		transition: color 0.2s ease;
		display: inline-flex;
		align-items: center;
		width: fit-content;
	}

	.back-link:hover {
		color: var(--color-on-background);
	}

	.title-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.story-badge {
		background: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.8rem;
		width: fit-content;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.title-meta h1 {
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		margin: 0;
		line-height: 1.15;
		background: linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.status-banner {
		display: flex;
		gap: 1.25rem;
		padding: 1.25rem 1.5rem;
		border-radius: 1.25rem;
		border: 1px solid var(--color-outline-variant);
		backdrop-filter: blur(10px);
	}

	.status-banner--published {
		background: var(--color-success-container);
		border-color: rgba(16, 185, 129, 0.2);
		color: var(--color-success);
	}

	.status-banner--published code {
		background: rgba(16, 185, 129, 0.1);
		padding: 0.15rem 0.35rem;
		border-radius: 0.35rem;
		font-weight: 600;
	}

	.status-banner--draft {
		background: var(--color-warning-container);
		border-color: rgba(245, 158, 11, 0.2);
		color: var(--color-warning);
	}

	.status-banner--draft a {
		color: inherit;
		text-decoration: underline;
		font-weight: 700;
	}

	.status-icon {
		font-size: 1.75rem;
		font-weight: 800;
		line-height: 1;
	}

	.status-content h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.status-content p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		opacity: 0.9;
	}

	.story-content {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	.story-row {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		background: var(--color-panel-strong);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.5rem;
		overflow: hidden;
		box-shadow: var(--shadow-subtle);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
	}

	.story-row:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.story-illustration-container {
		width: 100%;
		border-bottom: 1px solid var(--color-outline-variant);
		overflow: hidden;
	}

	.story-illustration {
		width: 100%;
		height: auto;
		max-height: 400px;
		object-fit: cover;
		display: block;
		transition: transform 0.5s ease;
	}

	.story-row:hover .story-illustration {
		transform: scale(1.02);
	}

	.story-text-container {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.segment-marker {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-on-surface-variant);
		opacity: 0.8;
	}

	.story-text {
		font-size: 1.25rem;
		line-height: 1.8;
		margin: 0;
		font-weight: 500;
		color: var(--color-on-surface);
	}

	@media (max-width: 768px) {
		.showcase-reader {
			padding: 0 1rem;
			margin: 1rem auto;
		}

		.title-meta h1 {
			font-size: 2rem;
		}

		.story-text-container {
			padding: 1.25rem;
		}

		.story-text {
			font-size: 1.1rem;
		}
	}
</style>
