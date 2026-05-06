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
	}

	h1 {
		margin: 0 0 0.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		border-bottom: 1px solid #ddd;
		text-align: left;
		padding: 0.625rem;
	}

	button {
		padding: 0.45rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #5b420e;
		background: #efe6d0;
		color: #5b420e;
		font-weight: 700;
		cursor: pointer;
	}

	.message {
		margin-top: 0.75rem;
		font-weight: 700;
		color: #1f4f3f;
	}

	.error {
		margin-top: 0.75rem;
		font-weight: 700;
		color: #8a1f1f;
	}
</style>