<script lang="ts">
	import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

	let { value, storyId, onchange } = $props<{
		value: string;
		storyId: string;
		onchange: (lang: string) => void;
	}>();

	function handleChange(e: Event) {
		const selected = (e.target as HTMLSelectElement).value;
		onchange(selected);
	}
</script>

<div class="language-selector">
	<label for="language-select-{storyId}" class="language-label">Target Language</label>
	<select
		id="language-select-{storyId}"
		{value}
		onchange={handleChange}
		data-testid="language-selector"
		aria-label="Select target language"
	>
		{#each SUPPORTED_LANGUAGES as lang (lang)}
			<option value={lang}>{lang}</option>
		{/each}
	</select>
</div>

<style>
	.language-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.language-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-on-surface-variant);
		white-space: nowrap;
	}

	select {
		font-size: 0.95rem;
		font-weight: 600;
		padding: 0.75rem 0.95rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 0.75rem;
		background: var(--color-surface);
		color: var(--color-on-surface);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 4px rgba(31, 92, 230, 0.12);
	}
</style>
