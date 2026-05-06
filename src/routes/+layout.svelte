<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import '$lib/../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{data.pageTitle}</title>
	<meta name="description" content={data.description} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="app-container">
	<Navigation />
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--color-background, #fbf8fe);
	}

	.app-main {
		flex: 1;
		padding: 1rem 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}
</style>
