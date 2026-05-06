<script lang="ts">
	import LeadApprovalGate from '$lib/components/LeadApprovalGate.svelte';

	let { data } = $props();
</script>

{#if !data.sourceAvailable}
	<p>
		OBS source folder was not found at <code>en_obs/content</code>. Add source files to view the lead
		approval queue.
	</p>
{/if}

<LeadApprovalGate items={data.items} />
