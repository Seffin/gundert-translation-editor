import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ActivityLog from '$lib/components/ActivityLog.svelte';
import { buildDemoActivityEvents } from '$lib/activity-log';

describe('ActivityLog', () => {
	it('renders activity events', async () => {
		render(ActivityLog, { props: { events: buildDemoActivityEvents() } });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Activity Log');
		await expect.element(page.getByTestId('event-actor-reviewer.demo')).toBeInTheDocument();
	});

	it('filters list by actor', async () => {
		render(ActivityLog, { props: { events: buildDemoActivityEvents() } });

		await page.getByLabelText('Filter actor').selectOptions('translator.demo');

		await expect.element(page.getByTestId('event-actor-translator.demo')).toBeInTheDocument();
		await expect.element(page.getByTestId('event-actor-reviewer.demo')).not.toBeInTheDocument();
	});

	it('filters list by action type and date range', async () => {
		render(ActivityLog, { props: { events: buildDemoActivityEvents() } });

		await page.getByLabelText('Filter action').selectOptions('approve');
		await page.getByLabelText('Filter date range').selectOptions('last-7-days');

		await expect.element(page.getByTestId('event-action-approve')).toBeInTheDocument();
		await expect.element(page.getByTestId('event-action-draft')).not.toBeInTheDocument();
	});
});
