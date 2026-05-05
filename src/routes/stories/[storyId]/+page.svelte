<script lang="ts">
	import StoryEditorBaseline from '$lib/components/StoryEditorBaseline.svelte';

	let { data } = $props();
</script>

<StoryEditorBaseline story={data.story} />
