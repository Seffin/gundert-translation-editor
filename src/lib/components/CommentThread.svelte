<script lang="ts">
	import type { ReviewerComment } from '$lib/server/reviewer-comments';
	import type { EditorSegment } from '$lib/server/editor';
	import { onMount } from 'svelte';

	interface Props {
		storyId: string;
		currentUserId: string;
		segments?: EditorSegment[];
	}

	let { storyId, currentUserId, segments = [] }: Props = $props();

	let comments: ReviewerComment[] = $state([]);
	let newMessage = $state('');
	let selectedSegmentId = $state<string | null>(null);
	let isLoading = $state(false);
	let isAdding = $state(false);
	let error = $state<string | null>(null);

	const unresolvedCount = $derived(comments.filter((c) => !c.resolved).length);
	const resolvedCount = $derived(comments.filter((c) => c.resolved).length);

	onMount(async () => {
		await fetchComments();
	});

	async function fetchComments() {
		isLoading = true;
		error = null;
		try {
			const response = await fetch(`/api/reviewer-comments?storyId=${storyId}`);
			if (!response.ok) throw new Error('Failed to fetch comments');
			const data = await response.json();
			comments = data.comments || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}

	async function addComment() {
		if (!newMessage.trim()) return;

		isAdding = true;
		error = null;
		try {
			const response = await fetch('/api/reviewer-comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storyId,
					authorId: currentUserId,
					message: newMessage,
					segmentId: selectedSegmentId
				})
			});

			if (!response.ok) throw new Error('Failed to add comment');
			const data = await response.json();

			comments = [...comments, data.comment];
			newMessage = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add comment';
		} finally {
			isAdding = false;
		}
	}

	async function resolveComment(commentId: string) {
		error = null;
		try {
			const response = await fetch('/api/reviewer-comments/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ storyId, commentId })
			});

			if (!response.ok) throw new Error('Failed to resolve comment');

			comments = comments.map((c) => (c.id === commentId ? { ...c, resolved: true } : c));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to resolve comment';
		}
	}

	async function resolveAll() {
		if (unresolvedCount === 0) return;

		error = null;
		try {
			const response = await fetch('/api/reviewer-comments/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ storyId })
			});

			if (!response.ok) throw new Error('Failed to resolve comments');

			comments = comments.map((c) => (c.resolved ? c : { ...c, resolved: true }));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to resolve comments';
		}
	}
</script>

<aside class="comment-thread">
	<div class="header">
		<h3>Reviewer Comments</h3>
		<div class="badge-row">
			{#if unresolvedCount > 0}
				<span class="badge badge-unresolved">{unresolvedCount} Unresolved</span>
			{/if}
			{#if resolvedCount > 0}
				<span class="badge badge-resolved">{resolvedCount} Resolved</span>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if isLoading}
		<div class="loading">Loading comments...</div>
	{:else if comments.length === 0}
		<div class="empty-state">No comments yet.</div>
	{:else}
		<div class="comments-list">
			{#each comments as comment (comment.id)}
				<div class="comment" class:resolved={comment.resolved}>
					<div class="comment-header">
						<span class="author">{comment.authorId}</span>
						<span class="timestamp">{new Date(comment.createdAt).toLocaleString()}</span>
						{#if comment.segmentId}
							<span class="segment-badge">Segment {comment.segmentId}</span>
						{/if}
						{#if comment.resolved}
							<span class="resolved-label">✓ Resolved</span>
						{/if}
					</div>
					<p class="message">{comment.message}</p>
					{#if !comment.resolved}
						<button class="resolve-btn" onclick={() => resolveComment(comment.id)}>
							Mark Resolved
						</button>
					{/if}
				</div>
			{/each}
		</div>

		{#if unresolvedCount > 0}
			<button class="resolve-all-btn" onclick={resolveAll}>
				Resolve All ({unresolvedCount})
			</button>
		{/if}
	{/if}

	<div class="add-comment">
		{#if segments.length > 0}
			<div class="segment-selector">
				<label for="segment-select">On segment:</label>
				<select id="segment-select" bind:value={selectedSegmentId}>
					<option value={null}>Whole story</option>
					{#each segments as segment, index (segment.id)}
						<option value={segment.id}>Segment {index + 1}</option>
					{/each}
				</select>
			</div>
		{/if}
		<textarea bind:value={newMessage} placeholder="Add a comment..." disabled={isAdding} rows="3"
		></textarea>
		<button onclick={addComment} disabled={isAdding || !newMessage.trim()}>
			{isAdding ? 'Adding...' : 'Add Comment'}
		</button>
	</div>
</aside>

<style>
	.comment-thread {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-surface);
		border-left: 1px solid var(--color-outline-variant);
		overflow-y: auto;
		max-height: 100vh;
		min-width: 0;
		width: 100%;
		max-width: 420px;
		box-sizing: border-box;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-bottom: 1px solid var(--color-outline-variant);
		padding-bottom: 1rem;
	}

	.header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-on-surface);
	}

	.badge-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-weight: 700;
	}

	.badge-unresolved {
		background: var(--color-warning-container);
		color: var(--color-warning);
	}

	.badge-resolved {
		background: var(--color-success-container);
		color: var(--color-success);
	}

	.error-message {
		padding: 0.75rem;
		background: var(--color-error-container);
		color: var(--color-error);
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.loading,
	.empty-state {
		padding: 1rem;
		text-align: center;
		color: var(--color-on-surface-variant);
		font-size: 0.875rem;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 50vh;
		overflow-y: auto;
	}

	.comment {
		padding: 0.75rem;
		background: var(--color-surface-container-lowest);
		border: 1px solid var(--color-outline-variant);
		border-radius: 0.375rem;
		transition: opacity 0.2s;
	}

	.comment.resolved {
		opacity: 0.6;
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-on-surface-variant);
	}

	.author {
		font-weight: 600;
		color: var(--color-on-surface);
	}

	.timestamp {
		color: var(--color-on-surface-variant);
		font-size: 0.75rem;
	}

	.resolved-label {
		margin-left: auto;
		color: var(--color-success);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.segment-badge {
		background: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.message {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
		word-wrap: break-word;
		color: var(--color-on-surface);
	}

	.resolve-btn {
		background: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		border: 1px solid var(--color-outline-variant);
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 700;
		transition: background 0.2s, transform 0.2s;
	}

	.resolve-btn:hover {
		background: var(--color-surface-container-high);
	}

	.resolve-all-btn {
		background: var(--color-success);
		color: var(--color-on-primary);
		border: 1px solid var(--color-success);
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		font-weight: 700;
		transition: background 0.2s, transform 0.2s;
		width: 100%;
	}

	.resolve-all-btn:hover {
		background: var(--color-success-container);
		color: var(--color-success);
	}

	.add-comment {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-outline-variant);
	}

	.segment-selector {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.875rem;
	}

	.segment-selector label {
		font-weight: 600;
		white-space: nowrap;
		color: var(--color-on-background);
	}

	.segment-selector select {
		flex: 1;
		padding: 0.375rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: inherit;
		background: var(--color-surface-container-lowest);
		color: var(--color-on-background);
	}

	.segment-selector select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-accent-soft);
	}

	.add-comment textarea {
		padding: 0.5rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 0.375rem;
		font-family: inherit;
		font-size: 0.875rem;
		resize: none;
		background: var(--color-surface-container-lowest);
		color: var(--color-on-background);
	}

	.add-comment textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-accent-soft);
	}

	.add-comment textarea:disabled {
		background: var(--color-surface-container-low);
		color: var(--color-on-surface-variant);
		cursor: not-allowed;
	}

	.add-comment button {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border: 1px solid var(--color-primary);
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		font-weight: 700;
		transition: background 0.2s, transform 0.2s;
	}

	.add-comment button:hover:not(:disabled) {
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
	}

	.add-comment button:disabled {
		background: var(--color-surface-container-low);
		color: var(--color-on-surface-variant);
		border: 1px solid var(--color-outline-variant);
		cursor: not-allowed;
	}

	@media (max-width: 900px) {
		.comment-thread {
			border-left: none;
			max-width: 100%;
			padding: 0.75rem;
		}

		.comments-list {
			max-height: 40vh;
		}

		.resolve-all-btn {
			position: sticky;
			bottom: 0;
		}
	}
</style>
