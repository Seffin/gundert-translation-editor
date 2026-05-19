import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GlossaryManager from '$lib/components/GlossaryManager.svelte';
import type { GlossaryTerm } from '$lib/glossary';

const TERMS: GlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'Grace',
		targetTerm: 'Anugrah',
		status: 'Approved',
		rationale: 'Unmerited divine favor'
	},
	{
		id: 'term-2',
		sourceTerm: 'Covenant',
		targetTerm: 'Ahd',
		status: 'Proposed',
		rationale: 'Formal agreement'
	}
];

describe('GlossaryManager', () => {
	it('renders glossary terms in the table', async () => {
		render(GlossaryManager, { initialTerms: TERMS });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Glossary Management');
		await expect.element(page.getByText('Grace')).toBeInTheDocument();
		await expect.element(page.getByText('Anugrah')).toBeInTheDocument();
	});

	it('adds a new term from the form', async () => {
		render(GlossaryManager, { initialTerms: TERMS });

		await page.getByLabelText('Source term').fill('Messiah');
		await page.getByLabelText('Target term').fill('Masih');
		await page.getByRole('button', { name: 'Add Term' }).click();

		await expect.element(page.getByRole('cell', { name: 'Messiah' })).toBeInTheDocument();
		await expect.element(page.getByRole('cell', { name: 'Masih' })).toBeInTheDocument();
	});

	it('loads a term into the form and saves edits', async () => {
		render(GlossaryManager, { initialTerms: TERMS });

		await page.getByRole('button', { name: 'Edit term-2' }).click();
		await page.getByLabelText('Target term').fill('Berith');
		await page.getByRole('button', { name: 'Save Changes' }).click();

		await expect.element(page.getByText('Berith')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Add Term' })).toBeInTheDocument();
	});
});
