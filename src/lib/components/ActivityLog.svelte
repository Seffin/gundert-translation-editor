<script lang="ts">
	import {
		classifyEventActorType,
		filterActivityEvents,
		type ActivityEvent,
		type ActivityLogFilter
	} from '$lib/activity-log';

	let { events = [] } = $props<{ events?: ActivityEvent[] }>();

	let actorOptions = $derived([
		'all',
		...Array.from(new Set(events.map((event) => event.actorId)))
	]);

	let filter = $state<ActivityLogFilter>({
		actorId: 'all',
		action: 'all',
		dateRange: 'all'
	});

	let filteredEvents = $derived(filterActivityEvents(events, filter, '2026-05-06T10:30:00.000Z'));
</script>

<section aria-label="activity-log">
	<h1>Activity Log</h1>
	<p>Complete audit trail of draft, edit, review, and approval actions.</p>

	<div class="filters">
		<label>
			Filter actor
			<select bind:value={filter.actorId} aria-label="Filter actor">
				{#each actorOptions as actor (actor)}
					<option value={actor}>{actor}</option>
				{/each}
			</select>
		</label>

		<label>
			Filter action
			<select bind:value={filter.action} aria-label="Filter action">
				<option value="all">all</option>
				<option value="draft">draft</option>
				<option value="edit">edit</option>
				<option value="review">review</option>
				<option value="approve">approve</option>
			</select>
		</label>

		<label>
			Filter date range
			<select bind:value={filter.dateRange} aria-label="Filter date range">
				<option value="all">all</option>
				<option value="last-7-days">last-7-days</option>
				<option value="last-30-days">last-30-days</option>
			</select>
		</label>
	</div>

	{#if filteredEvents.length === 0}
		<p>No activity events match the selected filters.</p>
	{:else}
		<ul class="event-list">
			{#each filteredEvents as event (event.eventId)}
				<li>
					<div class="event-head">
						<span data-testid={`event-actor-${event.actorId}`}>{event.actorId}</span>
						<span data-testid={`event-action-${event.action}`}>{event.action}</span>
						<span>{event.createdAtIso}</span>
					</div>
					<div class="event-meta">
						<span>Story {event.storyId}</span>
						{#if event.segmentId}
							<span>Segment {event.segmentId}</span>
						{/if}
						<span>{classifyEventActorType(event)}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	section {
		padding: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
	}

	.filters {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-weight: 600;
	}

	select {
		padding: 0.45rem 0.5rem;
		border: 1px solid #c7c5d1;
	}

	.event-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}

	.event-list li {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
	}

	.event-head,
	.event-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.event-head {
		font-weight: 700;
	}
</style>
