import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Navigation from '$lib/components/Navigation.svelte';

const { mockPage } = vi.hoisted(() => {
	let value = { data: { user: null as any }, url: { pathname: '/' } };
	const subscribers = new Set<(val: any) => void>();
	const store = {
		subscribe(run: (val: any) => void) {
			subscribers.add(run);
			run(value);
			return () => subscribers.delete(run);
		},
		set(newValue: any) {
			value = newValue;
			for (const run of subscribers) {
				run(value);
			}
		},
		update(fn: (val: any) => any) {
			this.set(fn(value));
		}
	};
	return { mockPage: store };
});

vi.mock('$app/stores', () => {
	return {
		page: mockPage
	};
});

describe('Navigation', () => {
	it('renders only Demo link for unauthenticated user', async () => {
		mockPage.set({ data: { user: null }, url: { pathname: '/' } });
		render(Navigation);

		const demoLink = page.getByRole('link', { name: 'Demo' });
		await expect.element(demoLink).toBeInTheDocument();

		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect.element(settingsLink).not.toBeInTheDocument();
	});

	it('renders Settings and role-specific links for Translator', async () => {
		mockPage.set({
			data: { user: { username: 'translator.demo', role: 'Translator' } },
			url: { pathname: '/stories' }
		});
		render(Navigation);

		const storiesLink = page.getByRole('link', { name: 'Stories' });
		await expect.element(storiesLink).toBeInTheDocument();

		const glossaryLink = page.getByRole('link', { name: 'Glossary' });
		await expect.element(glossaryLink).toBeInTheDocument();

		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect.element(settingsLink).toBeInTheDocument();

		const demoLink = page.getByRole('link', { name: 'Demo' });
		await expect.element(demoLink).toBeInTheDocument();
	});

	it('renders Settings and role-specific links for Reviewer', async () => {
		mockPage.set({
			data: { user: { username: 'reviewer.demo', role: 'Reviewer' } },
			url: { pathname: '/reviewer' }
		});
		render(Navigation);

		const reviewerLink = page.getByRole('link', { name: 'Reviewer' });
		await expect.element(reviewerLink).toBeInTheDocument();

		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect.element(settingsLink).toBeInTheDocument();

		const demoLink = page.getByRole('link', { name: 'Demo' });
		await expect.element(demoLink).toBeInTheDocument();
	});

	it('renders Settings and role-specific links for Lead', async () => {
		mockPage.set({
			data: { user: { username: 'lead.demo', role: 'Lead' } },
			url: { pathname: '/lead' }
		});
		render(Navigation);

		const approvalLink = page.getByRole('link', { name: 'Approval' });
		await expect.element(approvalLink).toBeInTheDocument();

		const activityLink = page.getByRole('link', { name: 'Activity' });
		await expect.element(activityLink).toBeInTheDocument();

		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect.element(settingsLink).toBeInTheDocument();

		const demoLink = page.getByRole('link', { name: 'Demo' });
		await expect.element(demoLink).toBeInTheDocument();
	});
});
