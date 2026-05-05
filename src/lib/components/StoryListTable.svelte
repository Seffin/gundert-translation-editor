<script lang="ts">
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
	<p>Manage story progress, status, and assignees for Gundert Editor.</p>

	{#if stories.length === 0}
		<p>No stories found. Ensure OBS content is available.</p>
	{:else}
		<table>
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
				{#each stories as story}
					<tr>
						<td>{story.storyId}</td>
						<td><a href={`/stories/${story.storyId}`}>{story.title}</a></td>
						<td>
							<span class={statusClass(story.status)}>{story.status}</span>
						</td>
						<td>{story.assignee}</td>
						<td>{story.completionPercent}%</td>
						<td>{story.segmentCount}</td>
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

	.status-draft,
	.status-review,
	.status-approved,
	.status-blocked {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status-draft {
		background: #e9eef8;
		color: #213057;
	}

	.status-review {
		background: #efe6d0;
		color: #5b420e;
	}

	.status-approved {
		background: #dbf1e8;
		color: #1f4f3f;
	}

	.status-blocked {
		background: #ffd9d4;
		color: #7a1f1a;
	}
</style>
