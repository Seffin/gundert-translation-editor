<script lang="ts">
	import GlossaryManager from '$lib/components/GlossaryManager.svelte';

	let { data } = $props();
</script>

<GlossaryManager initialTerms={data.terms} />
