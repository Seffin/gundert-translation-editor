<script lang="ts">
	import { onMount } from 'svelte';
	import { loadSourceLanguage, loadGlobalTargetLanguage, saveGlobalTargetLanguage, loadTheme, saveTheme, type Theme } from '$lib/client/settings';
	import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

	let sourceLanguage = $state('English');
	let targetLanguage = $state('Hindi');
	let theme = $state<Theme>('system');

	onMount(() => {
		sourceLanguage = loadSourceLanguage();
		targetLanguage = loadGlobalTargetLanguage();
		theme = loadTheme();
	});

	function updateTarget(lang: string) {
		targetLanguage = lang;
		saveGlobalTargetLanguage(lang);
	}

	function updateTheme(newTheme: Theme) {
		theme = newTheme;
		saveTheme(newTheme);
		applyTheme(newTheme);
	}

	function applyTheme(t: Theme) {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		if (t === 'dark') {
			root.classList.add('dark');
		} else if (t === 'light') {
			root.classList.remove('dark');
		} else {
			// System
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}
		}
	}
</script>

<div class="section">
	<h1>Settings</h1>
	
	<div class="card grid cols-2">
		<div class="settings-group">
			<h2>Language Preferences</h2>
			<div class="settings-item">
				<span class="item-label">Source Language</span>
				<span class="locked-lang">English (Locked)</span>
				<p class="text-muted">Source language is fixed to English as content is only available in English.</p>
			</div>
			
			<div class="settings-item">
				<label for="target-lang" class="item-label">Default Target Language</label>
				<select id="target-lang" value={targetLanguage} onchange={(e) => updateTarget((e.target as HTMLSelectElement).value)}>
					{#each SUPPORTED_LANGUAGES as lang}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
				<p class="text-muted">This will be the default target language for new stories.</p>
			</div>
		</div>

		<div class="settings-group">
			<h2>Appearance</h2>
			<div class="settings-item">
				<span class="item-label">Theme Mode</span>
				<div class="theme-options">
					<label class="radio-label">
						<input type="radio" name="theme" value="system" checked={theme === 'system'} onchange={() => updateTheme('system')} />
						Default (System)
					</label>
					<label class="radio-label">
						<input type="radio" name="theme" value="light" checked={theme === 'light'} onchange={() => updateTheme('light')} />
						Light Mode
					</label>
					<label class="radio-label">
						<input type="radio" name="theme" value="dark" checked={theme === 'dark'} onchange={() => updateTheme('dark')} />
						Dark Mode
					</label>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-group {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.settings-item label,
	.item-label {
		font-weight: 600;
		color: var(--color-on-background);
		display: inline-block;
	}

	.locked-lang {
		padding: 0.5rem;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-md);
		color: var(--color-on-surface-variant);
		display: inline-block;
		max-width: 200px;
	}

	.theme-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: var(--color-on-background);
	}

	.text-muted {
		margin-top: 0.25rem;
	}
</style>
