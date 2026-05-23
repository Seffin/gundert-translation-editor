<script lang="ts">
	import { BRAND_NAME } from '$lib/brand';
	import type { StoryListItem } from '$lib/server/story-list';

	let { stories } = $props<{ stories: StoryListItem[] }>();

	function statusClass(status: StoryListItem['status']): string {
		switch (status) {
			case 'Approved':
				return 'status-approved';
			case 'In Review':
				return 'status-review';
			case 'Blocked':
				return 'status-blocked';
			case 'Draft':
			default:
				return 'status-draft';
		}
	}
</script>

<section aria-label="story-list">
	<h1>Open Bible Stories</h1>
	<p>Manage story progress, status, and assignees for {BRAND_NAME}.</p>

	{#if stories.length === 0}
		<p>No stories found. Ensure OBS content is available.</p>
	{:else}
		<div class="table-responsive">
			<table class="responsive">
				<thead>
					<tr>
						<th>#</th>
						<th>Title</th>
						<th>Status</th>
						<th>Assignee</th>
						<th>Completion</th>
						<th>Segments</th>
					</tr>
				</thead>
				<tbody>
					{#each stories as story (story.storyId)}
						<tr>
							<td data-label="#">{story.storyId}</td>
							<td data-label="Title"><a href={`/stories/${story.storyId}`}>{story.title}</a></td>
							<td data-label="Status">
								<span class={statusClass(story.status)}>{story.status}</span>
							</td>
							<td data-label="Assignee">{story.assignee}</td>
							<td data-label="Completion">{story.completionPercent}%</td>
							<td data-label="Segments">{story.segmentCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	section {
		padding: 2rem;
		max-width: 1280px;
		margin: 0 auto;
		background: var(--color-panel-strong);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.25rem;
		box-shadow: var(--shadow-subtle);
	}

	h1 {
		margin: 0 0 0.5rem;
	}

	p {
		margin: 0;
		color: var(--color-on-surface-variant);
	}

	.table-responsive {
		overflow-x: auto;
		margin-top: 1.25rem;
	}

	.table-responsive::-webkit-scrollbar {
		height: 8px;
	}

	.table-responsive::-webkit-scrollbar-track {
		background: var(--color-surface-container-low);
		border-radius: 4px;
	}

	.table-responsive::-webkit-scrollbar-thumb {
		background: var(--color-outline-variant);
		border-radius: 4px;
	}

	.table-responsive::-webkit-scrollbar-thumb:hover {
		background: var(--color-on-surface-variant);
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		min-width: 720px;
	}

	th,
	td {
		padding: 1rem 1.1rem;
		text-align: left;
		border-bottom: 1px solid var(--color-outline-variant);
	}

	th {
		background: var(--color-surface-container-high);
		color: var(--color-on-surface-variant);
		font-weight: 700;
	}

	tbody tr {
		background: var(--color-panel-strong);
		transition: background-color 0.2s ease;
	}

	tbody tr:hover {
		background: var(--color-surface-container-low);
	}

	/* Sticky columns to keep # and Title link always visible during horizontal scrolling */
	th:first-child,
	td:first-child {
		position: sticky;
		left: 0;
		z-index: 10;
		background: var(--color-surface-container-high);
		width: 60px;
		min-width: 60px;
		max-width: 60px;
	}

	td:first-child {
		background: var(--color-surface);
	}

	th:nth-child(2),
	td:nth-child(2) {
		position: sticky;
		left: 60px;
		z-index: 10;
		background: var(--color-surface-container-high);
		border-right: 1px solid var(--color-outline-variant);
		max-width: 240px;
	}

	td:nth-child(2) {
		background: var(--color-surface);
	}

	tbody tr:hover td:first-child,
	tbody tr:hover td:nth-child(2) {
		background: var(--color-surface-container-low);
	}

	a {
		color: var(--color-primary);
		text-decoration: none;
		word-break: break-word;
		overflow-wrap: break-word;
		white-space: normal;
	}

	a:hover {
		text-decoration: underline;
	}

	.status-draft,
	.status-review,
	.status-approved,
	.status-blocked {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.8rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 700;
	}

	.status-draft {
		background: var(--color-surface-container);
		color: var(--color-on-surface-variant);
	}

	.status-review {
		background: var(--color-warning-container);
		color: var(--color-warning);
	}

	.status-approved {
		background: var(--color-success-container);
		color: var(--color-success);
	}

	.status-blocked {
		background: var(--color-error-container);
		color: var(--color-error);
	}

	@media (max-width: 768px) {
		section {
			padding: 1rem;
			background: transparent;
			border: none;
			box-shadow: none;
			border-radius: 0;
		}
	}
</style>
