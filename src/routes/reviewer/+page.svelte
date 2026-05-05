<script lang="ts">
	import ReviewerQueue from '$lib/components/ReviewerQueue.svelte';

	let { data } = $props();
</script>

{#if !data.sourceAvailable}
	<p>OBS source folder was not found at <code>en_obs/content</code>. Add source files to view the reviewer queue.</p>
{/if}

<ReviewerQueue items={data.items} />