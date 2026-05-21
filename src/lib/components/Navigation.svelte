<script lang="ts">
	import { page } from '$app/stores';
	import { COLORS } from '$lib/design-tokens';
	import { BRAND_NAME } from '$lib/brand';

	let mobileMenuOpen = $state(false);

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

<nav
	class="gundert-nav"
	style:--primary-color={COLORS.primary}
	style:--surface-color={COLORS.surface}
>
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
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			type="button"
		>
			<span class="hamburger-box">
				<span class="hamburger-inner"></span>
			</span>
		</button>

		<ul id="main-nav" class="nav-menu" class:open={mobileMenuOpen}>
			{#each navigationItems as item (item.path)}
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
			<li class="mobile-settings">
				<a href="/settings" class="nav-link" title="Settings">
					<span class="icon">⚙️</span>
					<span class="label">Settings</span>
				</a>
			</li>
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
		background: var(--color-panel-strong);
		color: var(--color-on-background);
		padding: 0;
		margin: 0;
		border-bottom: 1px solid var(--color-outline-variant);
		box-shadow: 0 18px 40px rgba(15, 30, 60, 0.08);
		backdrop-filter: blur(15px);
	}

	.nav-container {
		display: flex;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		gap: 2rem;
	}

	.nav-brand {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
	}

	.brand-kicker {
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.85;
		color: var(--color-on-surface-variant);
	}

	.nav-brand h1 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--color-primary);
	}

	.nav-menu {
		display: flex;
		gap: 0.5rem;
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
		padding: 0.85rem 1.1rem;
		text-decoration: none;
		color: var(--color-on-background);
		font-size: 0.95rem;
		font-weight: 600;
		border-radius: 999px;
		transition: background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
		opacity: 0.95;
	}

	.nav-link:hover {
		opacity: 1;
		background-color: rgba(79, 70, 229, 0.08);
		transform: translateY(-1px);
	}

	.nav-link.active {
		opacity: 1;
		background: rgba(79, 70, 229, 0.12);
		color: var(--color-primary);
		box-shadow: inset 0 0 0 1px rgba(79, 70, 229, 0.14);
	}

	.icon {
		font-size: 1.05rem;
	}

	.nav-settings {
		position: relative;
	}

	.mobile-settings {
		display: none;
	}

	.hamburger {
		display: none;
		background: transparent;
		border: none;
		padding: 0.6rem;
		margin-left: 0.5rem;
		cursor: pointer;
		color: inherit;
	}

	.hamburger-box {
		width: 26px;
		height: 18px;
		position: relative;
	}

	.hamburger-inner,
	.hamburger-inner::before,
	.hamburger-inner::after {
		width: 26px;
		height: 2px;
		background-color: currentColor;
		position: absolute;
		left: 0;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.hamburger-inner {
		top: 50%;
		transform: translateY(-50%);
	}
	.hamburger-inner::before {
		content: '';
		top: -8px;
	}
	.hamburger-inner::after {
		content: '';
		top: 8px;
	}

	.nav-menu.open {
		display: flex;
	}

	.settings-btn {
		background: var(--color-surface);
		border: 1px solid rgba(79, 70, 229, 0.18);
		color: var(--color-on-background);
		border-radius: 999px;
		padding: 0.8rem 1rem;
	}

	@media (max-width: 768px) {
		.gundert-nav {
			position: fixed;
			bottom: 0;
			top: auto;
			left: 0;
			right: 0;
			z-index: 50;
			background: var(--color-panel-strong);
			box-shadow: 0 -14px 36px rgba(15, 30, 60, 0.12);
			backdrop-filter: blur(12px);
			padding: 0.25rem 0;
		}

		.nav-container {
			padding: 0 0.75rem;
			gap: 0.75rem;
			justify-content: space-between;
		}

		.nav-brand,
		.nav-settings {
			display: none;
		}

		.nav-menu {
			display: flex;
			flex-direction: row;
			flex-wrap: nowrap;
			padding: 0.25rem 0.25rem;
			gap: 0.25rem;
			justify-content: space-between;
			width: 100%;
		}

		.nav-menu li {
			flex: 1 1 0;
			min-width: 0;
		}

		.nav-link {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.2rem;
			padding: 0.4rem 0.25rem;
			font-size: 0.72rem;
			min-width: 0;
			border-radius: 0.65rem;
			opacity: 0.95;
			width: 100%;
			box-sizing: border-box;
			text-align: center;
			white-space: nowrap;
		}

		.mobile-settings {
			display: list-item;
		}

		.icon {
			font-size: 1.2rem;
		}
		.label {
			font-size: 0.65rem;
			margin: 0;
		}

		.nav-link.active {
			background: rgba(255, 255, 255, 0.16);
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
		}

		.hamburger {
			display: none;
		}
	}

	@media (max-width: 540px) {
		.nav-link {
			font-size: 0.65rem;
			padding: 0.3rem 0.2rem;
		}
		.label {
			font-size: 0.55rem;
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.nav-container {
			padding: 0.75rem 1rem;
			gap: 1rem;
		}
		.nav-brand h1 {
			font-size: 1.15rem;
		}
		.nav-menu {
			gap: 0.5rem;
		}
		.nav-link {
			padding: 0.6rem 0.8rem;
			font-size: 0.8rem;
		}
		.hamburger {
			display: inline-flex;
		}
		.nav-settings {
			display: block;
		}
	}
</style>
