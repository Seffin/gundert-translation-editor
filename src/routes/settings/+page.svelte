<script lang="ts">
	import { onMount } from 'svelte';
import { loadGlobalTargetLanguage, saveGlobalTargetLanguage, loadTheme, saveTheme, loadApiKey, saveApiKey, clearApiKey, type Theme } from '$lib/client/settings';
import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

let targetLanguage = $state('Hindi');
let theme = $state<Theme>('system');
let apiKey = $state('');
let apiKeySaved = $state(false);

onMount(() => {
	targetLanguage = loadGlobalTargetLanguage();
	theme = loadTheme();
	apiKey = loadApiKey();
	apiKeySaved = apiKey.length > 0;
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

function updateApiKey(value: string) {
	apiKey = value;
	saveApiKey(value);
	apiKeySaved = value.length > 0;
}

function removeApiKey() {
	apiKey = '';
	apiKeySaved = false;
	clearApiKey();
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
					{#each SUPPORTED_LANGUAGES as lang (lang)}
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

		<div class="settings-group">
			<h2>Personal Preferences</h2>
			<div class="settings-item">
				<label for="api-key" class="item-label">API Key</label>
				<input
					type="password"
					id="api-key"
					value={apiKey}
					oninput={(e) => updateApiKey((e.target as HTMLInputElement).value)}
					placeholder="Enter your Gemini API key"
				/>
				<p class="text-muted">This key is stored locally on your device only.</p>
				{#if apiKeySaved}
					<button type="button" class="secondary-btn" onclick={removeApiKey}>Clear API Key</button>
				{/if}
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

	.settings-item input[type='password'] {
		padding: 0.65rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-outline-variant);
		background: var(--color-surface);
		color: var(--color-on-background);
		width: 100%;
		max-width: 100%;
	}

	.secondary-btn {
		margin-top: 0.5rem;
		padding: 0.55rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-outline-variant);
		background: transparent;
		color: var(--color-on-background);
		cursor: pointer;
	}

	.secondary-btn:hover {
		background: rgba(255,255,255,0.06);
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
