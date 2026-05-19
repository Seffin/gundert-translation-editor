import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LanguageSelector from '$lib/components/LanguageSelector.svelte';
import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

describe('LanguageSelector', () => {
	it('renders a select with all supported languages as options', async () => {
		render(LanguageSelector, { value: 'Hindi', storyId: 'story-01', onchange: vi.fn() });

		const select = page.getByTestId('language-selector');
		await expect.element(select).toBeInTheDocument();

		// Verify a sample of languages are present as options
		await expect.element(page.getByRole('option', { name: 'Hindi' })).toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: 'Tamil' })).toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: 'Swahili' })).toBeInTheDocument();
	});

	it('reflects the current value as the selected option', async () => {
		render(LanguageSelector, { value: 'Tamil', storyId: 'story-01', onchange: vi.fn() });

		const select = page.getByTestId('language-selector');
		await expect.element(select).toHaveValue('Tamil');
	});

	it('calls onchange callback when selection changes', async () => {
		const onchange = vi.fn();
		render(LanguageSelector, { value: 'Hindi', storyId: 'story-01', onchange });

		const select = page.getByTestId('language-selector');
		await select.selectOptions('Telugu');

		expect(onchange).toHaveBeenCalledWith('Telugu');
	});

	it('renders all supported languages as options', async () => {
		render(LanguageSelector, { value: 'Hindi', storyId: 'story-01', onchange: vi.fn() });

		const options = page.getByRole('option');
		await expect.element(options.first()).toBeInTheDocument();

		// Number of options matches supported languages
		const count = await options.all();
		expect(count.length).toBe(SUPPORTED_LANGUAGES.length);
	});
});
