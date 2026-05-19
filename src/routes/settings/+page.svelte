<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadGlobalTargetLanguage,
		saveGlobalTargetLanguage,
		loadTheme,
		saveTheme,
		loadApiKey,
		saveApiKey,
		clearApiKey,
		type Theme
	} from '$lib/client/settings';
	import { SUPPORTED_LANGUAGES, isValidLanguage } from '$lib/client/target-language';

	let targetLanguage = $state('Hindi');
	let theme = $state<Theme>('system');
	let apiKey = $state('');
	let apiKeySaved = $state(false);
	let saveMessage = $state('');
	let saveMessageType = $state<'success' | 'error'>('success');

	onMount(() => {
		try {
			targetLanguage = loadGlobalTargetLanguage();
			theme = loadTheme();
			apiKey = loadApiKey();
			apiKeySaved = apiKey.length > 0;
		} catch (error) {
			console.error('Failed to load settings:', error);
			showMessage('Failed to load settings', 'error');
		}
	});

	function updateTarget(lang: string) {
		if (!isValidLanguage(lang)) {
			showMessage('Invalid language selected', 'error');
			return;
		}
		try {
			targetLanguage = lang;
			saveGlobalTargetLanguage(lang);
			showMessage('Language preference saved', 'success');
		} catch (error) {
			console.error('Failed to save language:', error);
			showMessage('Failed to save language preference', 'error');
		}
	}

	function updateTheme(newTheme: Theme) {
		try {
			theme = newTheme;
			saveTheme(newTheme);
			applyTheme(newTheme);
			showMessage('Theme preference saved', 'success');
		} catch (error) {
			console.error('Failed to save theme:', error);
			showMessage('Failed to save theme preference', 'error');
		}
	}

	function updateApiKey(value: string) {
		apiKey = value;
		try {
			saveApiKey(value);
			apiKeySaved = value.length > 0;
			if (value.length > 0) {
				showMessage('API key saved', 'success');
			}
		} catch (error) {
			console.error('Failed to save API key:', error);
			showMessage('Failed to save API key', 'error');
		}
	}

	function removeApiKey() {
		try {
			apiKey = '';
			apiKeySaved = false;
			clearApiKey();
			showMessage('API key cleared', 'success');
		} catch (error) {
			console.error('Failed to clear API key:', error);
			showMessage('Failed to clear API key', 'error');
		}
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

	function showMessage(msg: string, type: 'success' | 'error') {
		saveMessage = msg;
		saveMessageType = type;
		setTimeout(() => {
			saveMessage = '';
		}, 3000);
	}
</script>

<div class="section">
	<h1>Settings</h1>

	{#if saveMessage}
		<div class="save-message {saveMessageType}">
			{saveMessage}
		</div>
	{/if}

	<div class="settings-container">
		<div class="settings-card">
			<div class="card-header">
				<span class="card-icon">🌐</span>
				<h2>Language</h2>
			</div>
			<div class="card-body">
				<div class="setting-row">
					<div class="setting-info">
						<span class="setting-label">Source Language</span>
						<span class="setting-value locked">English</span>
					</div>
					<span class="setting-badge">Fixed</span>
				</div>
				<p class="setting-hint">Content is only available in English</p>

				<div class="setting-divider"></div>

				<div class="setting-row">
					<div class="setting-info">
						<label for="target-lang" class="setting-label">Target Language</label>
						<select
							id="target-lang"
							class="setting-select"
							value={targetLanguage}
							onchange={(e) => updateTarget((e.target as HTMLSelectElement).value)}
						>
							{#each SUPPORTED_LANGUAGES as lang (lang)}
								<option value={lang}>{lang}</option>
							{/each}
						</select>
					</div>
				</div>
				<p class="setting-hint">Default language for new stories</p>
			</div>
		</div>

		<div class="settings-card">
			<div class="card-header">
				<span class="card-icon">🎨</span>
				<h2>Appearance</h2>
			</div>
			<div class="card-body">
				<div class="theme-selector">
					<button
						type="button"
						class="theme-btn"
						class:active={theme === 'system'}
						onclick={() => updateTheme('system')}
					>
						<span class="theme-icon">💻</span>
						<span class="theme-label">System</span>
					</button>
					<button
						type="button"
						class="theme-btn"
						class:active={theme === 'light'}
						onclick={() => updateTheme('light')}
					>
						<span class="theme-icon">☀️</span>
						<span class="theme-label">Light</span>
					</button>
					<button
						type="button"
						class="theme-btn"
						class:active={theme === 'dark'}
						onclick={() => updateTheme('dark')}
					>
						<span class="theme-icon">🌙</span>
						<span class="theme-label">Dark</span>
					</button>
				</div>
			</div>
		</div>

		<div class="settings-card">
			<div class="card-header">
				<span class="card-icon">🔑</span>
				<h2>API Key</h2>
			</div>
			<div class="card-body">
				<div class="setting-row">
					<div class="setting-info full-width">
						<label for="api-key" class="setting-label">Gemini API Key</label>
						<div class="input-group">
							<input
								type="password"
								id="api-key"
								class="setting-input"
								value={apiKey}
								oninput={(e) => updateApiKey((e.target as HTMLInputElement).value)}
								placeholder="Enter your API key"
							/>
							{#if apiKeySaved}
								<button
									type="button"
									class="clear-btn"
									onclick={removeApiKey}
									title="Clear API key"
								>
									✕
								</button>
							{/if}
						</div>
					</div>
				</div>
				<p class="setting-hint">Stored locally on your device only</p>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 800px;
	}

	.settings-card {
		background: var(--color-panel-strong);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1rem;
		overflow: hidden;
		transition: box-shadow 0.2s ease;
	}

	.settings-card:hover {
		box-shadow: var(--shadow-low);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-outline-variant);
		background: var(--color-surface-container-low);
	}

	.card-icon {
		font-size: 1.5rem;
	}

	.card-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.card-body {
		padding: 1.5rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.setting-info.full-width {
		width: 100%;
	}

	.setting-label {
		font-weight: 600;
		color: var(--color-on-background);
		font-size: 0.9rem;
	}

	.setting-value {
		color: var(--color-on-surface);
		font-size: 0.95rem;
	}

	.setting-value.locked {
		color: var(--color-on-surface-variant);
		font-style: italic;
	}

	.setting-badge {
		padding: 0.25rem 0.75rem;
		background: var(--color-surface-container-high);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-hint {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-on-surface-variant);
	}

	.setting-divider {
		height: 1px;
		background: var(--color-outline-variant);
		margin: 1rem 0;
	}

	.setting-select,
	.setting-input {
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-outline-variant);
		background: var(--color-surface);
		color: var(--color-on-background);
		font-size: 0.95rem;
		width: 100%;
		max-width: 300px;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.setting-select:focus,
	.setting-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(20, 86, 217, 0.12);
	}

	.setting-input {
		max-width: 100%;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
		position: relative;
	}

	.clear-btn {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 0.5rem;
		background: var(--color-surface-container-high);
		color: var(--color-on-surface-variant);
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.clear-btn:hover {
		background: var(--color-error-container);
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.theme-selector {
		display: flex;
		gap: 0.75rem;
	}

	.theme-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid var(--color-outline-variant);
		border-radius: 0.75rem;
		background: var(--color-surface);
		color: var(--color-on-surface);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.theme-btn:hover {
		border-color: var(--color-primary);
		background: var(--color-surface-container-low);
	}

	.theme-btn.active {
		border-color: var(--color-primary);
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
	}

	.theme-icon {
		font-size: 1.5rem;
	}

	.theme-label {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.save-message {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		animation: slideIn 0.3s ease;
	}

	.save-message.success {
		background: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		border: 1px solid var(--color-secondary);
	}

	.save-message.error {
		background: var(--color-error-container);
		color: var(--color-error);
		border: 1px solid var(--color-error);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.settings-container {
			gap: 1rem;
		}

		.card-header {
			padding: 1rem 1.25rem;
		}

		.card-body {
			padding: 1.25rem;
		}

		.setting-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.setting-select {
			max-width: 100%;
		}

		.theme-selector {
			flex-direction: column;
		}

		.theme-btn {
			flex-direction: row;
			justify-content: center;
			padding: 0.75rem;
		}
	}
</style>
