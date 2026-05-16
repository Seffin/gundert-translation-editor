<script lang="ts">
	import { page } from '$app/stores';
	import { COLORS, SPACING } from '$lib/design-tokens';
	import { BRAND_NAME } from '$lib/brand';

	const navigationItems = [
		{ path: '/', label: 'Workspace', icon: '🏠' },
		{ path: '/stories', label: 'Stories', icon: '📖' },
		{ path: '/reviewer', label: 'Reviewer', icon: '👀' },
		{ path: '/lead', label: 'Approval', icon: '✓' },
		{ path: '/glossary', label: 'Glossary', icon: '📚' },
		{ path: '/activity', label: 'Activity', icon: '📋' },
		{ path: '/demo', label: 'Demo', icon: '🧪' }
	];

	function isActive(path: string): boolean {
		if (path === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(path);
	}
</script>

<nav class="gundert-nav" style:--primary-color={COLORS.primary} style:--surface-color={COLORS.surface}>
	<div class="nav-container">
		<div class="nav-brand">
			<span class="brand-kicker">Translation Workspace</span>
			<h1>{BRAND_NAME}</h1>
		</div>

		<ul class="nav-menu">
			{#each navigationItems as item}
				<li>
					<a
						href={item.path}
						class="nav-link"
						class:active={isActive(item.path)}
						title={item.label}
					>
						<span class="icon">{item.icon}</span>
						<span class="label">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<div class="nav-settings">
			<a href="/settings" class="nav-link settings-btn" title="Settings">
				<span class="icon">⚙️</span>
				<span class="label">Settings</span>
			</a>
		</div>
	</div>
</nav>

<style>
	.gundert-nav {
		position: sticky;
		top: 0;
		z-index: 20;
		background: linear-gradient(180deg, rgba(10, 36, 84, 0.94), rgba(20, 86, 217, 0.88));
		color: white;
		padding: 0;
		margin: 0;
		box-shadow: 0 16px 36px rgba(10, 36, 84, 0.18);
		backdrop-filter: blur(16px);
	}

	.nav-container {
		display: flex;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		gap: 3rem;
	}

	.nav-brand {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.brand-kicker {
		font-size: 0.68rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.72;
	}

	.nav-brand h1 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.nav-menu {
		display: flex;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		flex: 1;
		flex-wrap: wrap;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8rem 1rem;
		text-decoration: none;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		border-radius: 999px;
		transition: background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
		opacity: 0.82;
	}

	.nav-link:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.14);
		transform: translateY(-1px);
	}

	.nav-link.active {
		opacity: 1;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.18));
		font-weight: 600;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
	}

	.icon {
		font-size: 1rem;
		display: inline-block;
	}

	.label {
		display: inline;
	}

	.nav-settings {
		position: relative;
	}

	.settings-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: white;
	}

	@media (max-width: 768px) {
		.nav-container {
			padding: 0.75rem 1rem;
			gap: 1rem;
		}

		.nav-brand h1 {
			font-size: 1.25rem;
		}

		.nav-menu {
			gap: 0.25rem;
		}

		.nav-link {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.label {
			display: none;
		}

		.nav-link.active .label {
			display: inline;
		}
	}
</style>
