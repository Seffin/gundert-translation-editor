<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{data.pageTitle}</title>
	<meta name="description" content={data.description} />
</svelte:head>

{@render children()}
