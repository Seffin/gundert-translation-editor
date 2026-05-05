<script lang="ts">
	import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

	let {
		value,
		storyId,
		onchange
	} = $props<{ value: string; storyId: string; onchange: (lang: string) => void }>();

	function handleChange(e: Event) {
		const selected = (e.target as HTMLSelectElement).value;
		onchange(selected);
	}
</script>

<div class="language-selector">
	<label for="language-select-{storyId}" class="language-label">Target Language</label>
	<select
		id="language-select-{storyId}"
		value={value}
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
		gap: 0.5rem;
	}

	.language-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #4b5563;
		white-space: nowrap;
	}

	select {
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.3rem 0.6rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: #fff;
		color: #111827;
		cursor: pointer;
	}

	select:focus {
		outline: 2px solid #111827;
		outline-offset: 1px;
	}
</style>
