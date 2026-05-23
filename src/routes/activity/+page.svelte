<script lang="ts">
	import ActivityLog from '$lib/components/ActivityLog.svelte';

	let { data } = $props();
</script>

<ActivityLog events={data.events} />
