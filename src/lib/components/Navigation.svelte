<script lang="ts">
	import { page } from '$app/stores';
	import { COLORS, SPACING } from '$lib/design-tokens';
	import { BRAND_NAME } from '$lib/brand';

	let mobileMenuOpen = false;

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

		<!-- Mobile hamburger toggle -->
		<button
			class="hamburger"
			aria-label="Toggle navigation"
			aria-controls="main-nav"
			aria-expanded={mobileMenuOpen}
			on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
			type="button"
		>
			<span class="hamburger-box">
				<span class="hamburger-inner"></span>
			</span>
		</button>

		<ul id="main-nav" class="nav-menu" class:open={mobileMenuOpen}>
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

	/* Hamburger button */
	.hamburger {
		display: none;
		background: transparent;
		border: none;
		padding: 0.5rem;
		margin-left: 0.5rem;
		cursor: pointer;
		color: inherit;
	}

	.hamburger-box {
		width: 24px;
		height: 16px;
		display: inline-block;
		position: relative;
	}

	.hamburger-inner,
	.hamburger-inner::before,
	.hamburger-inner::after {
		width: 24px;
		height: 2px;
		background-color: currentColor;
		position: absolute;
		left: 0;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.hamburger-inner { top: 50%; transform: translateY(-50%); }
	.hamburger-inner::before { content: ''; top: -8px; }
	.hamburger-inner::after { content: ''; top: 8px; }

	.nav-menu.open { display: flex; }

	.settings-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: white;
	}

	@media (max-width: 768px) {
		/* Bottom fixed navigation for mobile */
		.gundert-nav {
			position: fixed;
			bottom: 0;
			top: auto;
			z-index: 50;
			background: linear-gradient(180deg, rgba(10, 36, 84, 0.98), rgba(20, 86, 217, 0.98));
			box-shadow: 0 -12px 30px rgba(10,36,84,0.18);
			backdrop-filter: blur(8px);
			padding: 0.25rem 0;
		}

		.nav-container {
			padding: 0 0.5rem;
			gap: 0.5rem;
			max-width: 100%;
			margin: 0 auto;
			align-items: center;
			justify-content: space-between;
		}

		/* hide large brand & settings on mobile bottom bar */
		.nav-brand { display: none; }
		.nav-settings { display: none; }

		/* show nav as a horizontal icon bar */
		.nav-menu {
			display: flex;
			position: relative;
			top: auto;
			left: auto;
			right: auto;
			background: transparent;
			flex-direction: row;
			padding: 0.25rem 0.25rem;
			gap: 0.25rem;
			justify-content: space-around;
			align-items: center;
			width: 100%;
			overflow-x: auto;
		}

		.nav-link {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 0.35rem 0.5rem;
			font-size: 0.675rem;
			min-width: 44px;
			border-radius: 0.5rem;
			opacity: 0.95;
		}

		.icon { font-size: 1.15rem; }
		.label { font-size: 0.6rem; margin-top: 3px; }

		/* active state emphasis on mobile */
		.nav-link.active {
			background: rgba(255,255,255,0.12);
			box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
		}

		/* hide hamburger on bottom nav */
		.hamburger { display: none; }
	}

	/* Tablet improvements: slightly denser layout and visible labels */
	@media (min-width: 769px) and (max-width: 1024px) {
		.nav-container { padding: 0.75rem 1rem; gap: 1rem; }
		.nav-brand h1 { font-size: 1.15rem; }
		.nav-menu { gap: 0.5rem; }
		.nav-link { padding: 0.6rem 0.8rem; font-size: 0.8rem; }
		.hamburger { display: inline-flex; }
		.nav-settings { display: block; }
	}
</style>
