import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('Admin +page.svelte', () => {
	it('renders the admin portal title and whitelisting header', async () => {
		render(Page, {
			data: {
				users: [
					{ id: 1, username: 'admin.demo', role: 'SuperAdmin' },
					{ id: 2, username: 'translator.demo', role: 'Translator' }
				]
			}
		});

		await expect.element(page.getByText('Super Admin Portal')).toBeInTheDocument();
		await expect.element(page.getByText('Pre-Register User')).toBeInTheDocument();
	});

	it('displays the list of whitelisted users in the authorized table', async () => {
		render(Page, {
			data: {
				users: [
					{ id: 1, username: 'admin.demo', role: 'SuperAdmin' },
					{ id: 2, username: 'translator.demo', role: 'Translator' }
				]
			}
		});

		await expect.element(page.getByText('admin.demo')).toBeInTheDocument();
		await expect.element(page.getByText('translator.demo')).toBeInTheDocument();
	});
});
