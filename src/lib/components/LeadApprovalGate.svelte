<script lang="ts">
	import { approveLeadApprovalItem, type LeadApprovalItem } from '$lib/lead-approval';
	import { loadPersistedStoryDraft } from '$lib/client/story-editor-draft';
	import { loadTargetLanguage } from '$lib/client/target-language';

	const ACTOR_ID = 'lead.demo';

	let { items } = $props<{ items: LeadApprovalItem[] }>();

	function createInitialItems() {
		return items.map((item: LeadApprovalItem) => ({ ...item }));
	}

	let approvalItems = $state(createInitialItems());
	let message = $state('');

	async function approveStory(storyId: string): Promise<void> {
		const index = approvalItems.findIndex((item: LeadApprovalItem) => item.storyId === storyId);
		if (index === -1) return;

		const approved = approveLeadApprovalItem(approvalItems[index]);
		approvalItems[index] = approved;
		approvalItems = [...approvalItems];

		// Load client-side target language and draft
		const targetLanguage = loadTargetLanguage(storyId);
		const draft = loadPersistedStoryDraft(storyId);

		message = `Story ${storyId} approved for publication.`;

		// Emit audit event to server
		try {
			await fetch('/api/audit-events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					actorId: ACTOR_ID,
					storyId,
					translations: draft ? draft.segments : null,
					targetLanguage
				})
			});
		} catch (error) {
			console.error('Failed to emit audit event:', error);
		}
	}

	function statusLabel(item: LeadApprovalItem): string {
		if (item.status === 'Approved') return 'Approved';
		if (item.canApprove) return 'Ready';
		return 'Blocked';
	}

	function blockersText(item: LeadApprovalItem): string {
		if (item.blockers.length === 0) return 'No blockers';
		return item.blockers.join('; ');
	}
</script>

<section aria-label="lead-approval-gate">
	<h1>Project Lead Approval</h1>
	<p>Approve stories that are ready and review blockers on stories that are not eligible.</p>

	{#if message}
		<p class="message" data-testid="approval-message">{message}</p>
	{/if}

	{#if approvalItems.length === 0}
		<p>No stories are currently in review for lead approval.</p>
	{:else}
		<div class="table-responsive">
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Title</th>
						<th>Assignee</th>
						<th>Gate</th>
						<th>Blockers</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each approvalItems as item (item.storyId)}
						<tr>
							<td>{item.storyId}</td>
							<td><a href={`/stories/${item.storyId}`}>{item.title}</a></td>
							<td>{item.assignee}</td>
							<td>{statusLabel(item)}</td>
							<td>{blockersText(item)}</td>
							<td>
								{#if item.canApprove}
									<button
										type="button"
										onclick={() => approveStory(item.storyId)}
										aria-label={`Approve story ${item.storyId}`}
									>
										Approve Ready Story
									</button>
								{:else if item.status === 'Approved'}
									<button type="button" disabled aria-label={`Approved story ${item.storyId}`}>
										Approved
									</button>
								{:else}
									<button type="button" disabled aria-label={`Blocked story ${item.storyId}`}>
										Approval Blocked
									</button>
								{/if}
							</td>
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
		border-bottom: 1px solid var(--color-outline-variant);
		text-align: left;
		padding: 1rem 1.1rem;
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
		padding: 0.45rem 0.75rem;
		border-radius: 0.5rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	button:not(:disabled) {
		border: 1px solid var(--color-success);
		background: var(--color-success-container);
		color: var(--color-success);
		cursor: pointer;
	}

	button:not(:disabled):hover {
		background: var(--color-success);
		color: var(--color-on-primary);
		transform: translateY(-1px);
	}

	button:disabled {
		border: 1px solid var(--color-outline-variant);
		background: var(--color-surface-container-low);
		color: var(--color-on-surface-variant);
	}

	.message {
		margin-top: 0.75rem;
		font-weight: 700;
		color: var(--color-success);
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
