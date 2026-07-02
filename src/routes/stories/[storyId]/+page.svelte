<script lang="ts">
	import StoryEditorBaseline from '$lib/components/StoryEditorBaseline.svelte';

	let { data } = $props();
</script>

<StoryEditorBaseline
	story={data.story}
	glossaryTerms={data.glossaryTerms}
	serverLockedInfo={data.lockedInfo}
	serverDraft={data.sqliteDraft}
/>
