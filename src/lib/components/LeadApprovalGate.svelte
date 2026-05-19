<script lang="ts">
	import { approveLeadApprovalItem, type LeadApprovalItem } from '$lib/lead-approval';

	const ACTOR_ID = 'lead.demo';

	let { items } = $props<{ items: LeadApprovalItem[] }>();

	function createInitialItems() {
		return items.map((item) => ({ ...item }));
	}

	let approvalItems = $state(createInitialItems());
	let message = $state('');

	async function approveStory(storyId: string): Promise<void> {
		const index = approvalItems.findIndex((item: LeadApprovalItem) => item.storyId === storyId);
		if (index === -1) return;

		const approved = approveLeadApprovalItem(approvalItems[index]);
		approvalItems[index] = approved;
		approvalItems = [...approvalItems];
		message = `Story ${storyId} approved for publication.`;

		// Emit audit event to server
		try {
			await fetch('/api/audit-events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					actorId: ACTOR_ID,
					storyId
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
		font-weight: 700;
	}

	button:not(:disabled) {
		border: 1px solid #1f4f3f;
		background: #dbf1e8;
		color: #1f4f3f;
		cursor: pointer;
	}

	button:disabled {
		border: 1px solid #9ca3af;
		background: #f3f4f6;
		color: #6b7280;
	}

	.message {
		margin-top: 0.75rem;
		font-weight: 700;
		color: #1f4f3f;
	}
</style>
