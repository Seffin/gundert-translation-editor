<script lang="ts">
	import StoryListTable from '$lib/components/StoryListTable.svelte';

	let { data } = $props();
</script>

{#if !data.sourceAvailable}
	<p>
		OBS source folder was not found at <code>en_obs/content</code>. Add source files to view
		stories.
	</p>
{/if}

<StoryListTable stories={data.stories} />
