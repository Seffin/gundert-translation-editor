<script lang="ts">
	import { resolveReviewerQueueItem, type ReviewerQueueItem } from '$lib/reviewer-queue';

	let { items } = $props<{ items: ReviewerQueueItem[] }>();

	function createInitialItems() {
		return items.map((item) => ({ ...item }));
	}

	let queueItems = $state(createInitialItems());
	let message = $state('');
	let errorMessage = $state('');

	async function resolveItem(storyId: string): Promise<void> {
		const item = queueItems.find((entry) => entry.storyId === storyId);
		if (!item) return;

		try {
			await fetch('/api/reviewer-comments/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ storyId })
			});

			resolveReviewerQueueItem(item);
			queueItems = queueItems.filter((entry) => entry.storyId !== storyId);
			errorMessage = '';
			message = `Resolved review for story ${storyId}`;
		} catch (error) {
			message = '';
			errorMessage =
				error instanceof Error
					? error.message
					: `Failed to resolve reviewer comments for story ${storyId}`;
		}
	}

	function commentLabel(count: number): string {
		return count === 1 ? '1 open comment' : `${count} open comments`;
	}
</script>

<section aria-label="reviewer-queue">
	<h1>Reviewer Queue</h1>
	<p>Review stories waiting for reviewer action and resolve them back to draft.</p>

	{#if message}
		<p class="message" data-testid="resolve-message">{message}</p>
	{/if}

	{#if errorMessage}
		<p class="error" data-testid="resolve-error">{errorMessage}</p>
	{/if}

	{#if queueItems.length === 0}
		<p>No stories currently need reviewer action.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Title</th>
					<th>Assignee</th>
					<th>Comments</th>
					<th>Segments</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#each queueItems as item (item.storyId)}
					<tr>
						<td>{item.storyId}</td>
						<td><a href={`/stories/${item.storyId}`}>{item.title}</a></td>
						<td>{item.assignee}</td>
						<td>{commentLabel(item.pendingComments)}</td>
						<td>{item.segmentCount}</td>
						<td>
							<button
								type="button"
								onclick={() => resolveItem(item.storyId)}
								aria-label={`Resolve for ${item.storyId}`}
							>
								Resolve and Return to Draft
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
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

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		margin-top: 1.25rem;
		min-width: 680px;
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

	button {
		padding: 0.75rem 1rem;
		border-radius: 0.85rem;
		border: 1px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		cursor: pointer;
		transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
	}

	button:hover {
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
		transform: translateY(-1px);
		box-shadow: 0 16px 24px rgba(31, 92, 230, 0.16);
	}

	.message {
		margin-top: 0.75rem;
		font-weight: 700;
		color: var(--color-success);
	}

	.error {
		margin-top: 0.75rem;
		font-weight: 700;
		color: var(--color-error);
	}
</style>
