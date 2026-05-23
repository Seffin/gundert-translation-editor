<script lang="ts">
	import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

	let { data } = $props();
</script>

<svelte:head>
	<title>Demonstration Showcase | Gundert Editor</title>
</svelte:head>

<section class="demo-dashboard" aria-label="demo-dashboard">
	<div class="dashboard-header">
		<h1>Demonstration Showcase</h1>
		<p>Explore the full end-to-end translation pipeline. Translate stories, approve them in the Project Lead gate, and view the final target-language publications with illustrations.</p>
	</div>

	<div class="language-selector-container">
		<span class="selector-label">View Publications In:</span>
		<div class="language-pills-scroll">
			{#each SUPPORTED_LANGUAGES as lang}
				<a
					href={`/demo?lang=${lang}`}
					class="lang-pill"
					class:lang-pill--active={lang === data.targetLanguage}
					data-testid={`lang-pill-${lang}`}
				>
					{lang}
				</a>
			{/each}
		</div>
	</div>

	<div class="stories-grid">
		{#if data.stories.length === 0}
			<div class="empty-state">
				<p>No stories found. Please add OBS source files to <code>en_obs/content</code>.</p>
			</div>
		{:else}
			{#each data.stories as item (item.storyId)}
				<article class="story-showcase-card" class:story-showcase-card--published={item.isPublished}>
					<header class="card-header">
						<span class="story-number">Story {item.storyId}</span>
						{#if item.isPublished}
							<span class="status-badge status-badge--published" data-testid={`published-badge-${item.storyId}`}>
								Published
							</span>
						{:else}
							<span class="status-badge status-badge--draft" data-testid={`draft-badge-${item.storyId}`}>
								In Draft
							</span>
						{/if}
					</header>

					<div class="card-body">
						<h2>{item.title}</h2>
						<p class="desc">
							{#if item.isPublished}
								{data.targetLanguage} publication is live and formatted with illustrations.
							{:else}
								Awaiting project lead approval in the dashboard to generate {data.targetLanguage} `.md` file.
							{/if}
						</p>
					</div>

					<footer class="card-footer">
						<a href={`/stories/${item.storyId}`} class="btn btn--secondary">
							Edit Translation
						</a>
						<a href={`/demo/stories/${item.storyId}?lang=${data.targetLanguage}`} class="btn btn--primary" class:btn--amber={!item.isPublished}>
							{#if item.isPublished}
								Read {data.targetLanguage}
							{:else}
								Preview Story
							{/if}
						</a>
					</footer>
				</article>
			{/each}
		{/if}
	</div>
</section>

<style>
	.demo-dashboard {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-header {
		margin-bottom: 2.5rem;
		background: var(--color-panel-strong);
		padding: 2rem;
		border-radius: 1.5rem;
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-subtle);
	}

	.dashboard-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.dashboard-header p {
		margin: 0;
		color: var(--color-on-surface-variant);
		font-size: 1.1rem;
		line-height: 1.6;
		max-width: 800px;
	}

	.language-selector-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 2rem;
		background: var(--color-panel-strong);
		padding: 1.25rem 1.5rem;
		border-radius: 1.25rem;
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-subtle);
	}

	.selector-label {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-on-surface-variant);
	}

	.language-pills-scroll {
		display: flex;
		gap: 0.6rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		scrollbar-width: thin;
	}

	.language-pills-scroll::-webkit-scrollbar {
		height: 4px;
	}

	.language-pills-scroll::-webkit-scrollbar-thumb {
		background: var(--color-outline-variant);
		border-radius: 4px;
	}

	.lang-pill {
		padding: 0.45rem 1rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 700;
		text-decoration: none;
		background: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface-variant);
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.lang-pill:hover {
		background: var(--color-surface-container-low);
		color: var(--color-on-background);
		border-color: var(--color-outline);
	}

	.lang-pill--active {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-color: var(--color-primary);
		box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
	}

	.lang-pill--active:hover {
		background: var(--color-primary);
		color: var(--color-on-primary);
		opacity: 0.95;
	}

	.stories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.5rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color-panel-strong);
		border-radius: 1.5rem;
		border: 1px dashed var(--color-outline-variant);
		color: var(--color-on-surface-variant);
	}

	.story-showcase-card {
		background: var(--color-panel-strong);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.5rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: var(--shadow-subtle);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
	}

	.story-showcase-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05);
	}

	.story-showcase-card--published {
		border-color: rgba(16, 185, 129, 0.3);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.story-number {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
	}

	.status-badge {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		letter-spacing: 0.02em;
	}

	.status-badge--published {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.status-badge--draft {
		background: rgba(107, 114, 128, 0.1);
		color: var(--color-on-surface-variant);
		border: 1px solid var(--color-outline-variant);
	}

	.card-body h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.25;
		color: var(--color-on-background);
	}

	.desc {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--color-on-surface-variant);
	}

	.card-footer {
		display: flex;
		gap: 0.75rem;
		margin-top: auto;
	}

	.btn {
		flex: 1;
		padding: 0.7rem 1rem;
		border-radius: 0.75rem;
		font-weight: 700;
		font-size: 0.88rem;
		text-align: center;
		text-decoration: none;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	.btn--primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
		box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
	}

	.btn--primary:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.btn--amber {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.2);
		box-shadow: none;
	}

	.btn--amber:hover {
		background: #f59e0b;
		color: white;
	}

	.btn--secondary {
		border: 1px solid var(--color-outline-variant);
		background: var(--color-surface);
		color: var(--color-on-background);
	}

	.btn--secondary:hover {
		background: var(--color-surface-container-low);
	}

	@media (max-width: 768px) {
		.demo-dashboard {
			padding: 1rem;
		}

		.dashboard-header {
			padding: 1.25rem;
			border-radius: 1rem;
		}

		.dashboard-header h1 {
			font-size: 1.85rem;
		}

		.stories-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
