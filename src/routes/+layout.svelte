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
	<script>
		(function () {
			const theme = localStorage.getItem('gundert-editor:theme') || 'system';
			const root = document.documentElement;
			if (theme === 'dark') {
				root.classList.add('dark');
			} else if (theme === 'light') {
				root.classList.remove('dark');
			} else {
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				if (prefersDark) {
					root.classList.add('dark');
				} else {
					root.classList.remove('dark');
				}
			}
		})();
	</script>
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
		background: transparent;
	}

	.app-main {
		flex: 1;
		padding: 0;
		max-width: none;
		margin: 0;
		width: 100%;
	}

	@media (max-width: 768px) {
		.app-main {
			padding: 0 0 70px 0;
			overflow-y: auto;
		}
	}
</style>
