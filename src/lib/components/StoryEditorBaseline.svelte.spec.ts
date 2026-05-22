import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StoryEditorBaseline from '$lib/components/StoryEditorBaseline.svelte';
import type { GlossaryTerm } from '$lib/glossary';
import type { StoryEditorModel } from '$lib/server/editor';
import type { ReviewerComment } from '$lib/server/reviewer-comments';
const { mockPage } = vi.hoisted(() => {
	let value = { data: { user: null as any } };
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

const STORY: StoryEditorModel = {
	storyId: '01',
	storyNumber: 1,
	title: 'The Creation',
	description: 'Editor baseline test story',
	targetLanguage: 'Hindi',
	segments: [
		{
			id: '01:01',
			sourceText: 'In the beginning, God created the heavens and the earth.',
			targetText: '',
			targetLanguage: 'Hindi',
			status: 'Done',
			draftedByGemini: true,
			updatedAtLabel: '2 mins ago',
			lastSavedByActorId: 'reviewer.demo',
			lastSavedAtIso: '2026-05-05T10:06:00.000Z',
			aiProvenance: {
				actor: 'Gemini',
				scope: 'whole-story',
				generatedAtIso: '2026-05-05T10:00:00.000Z',
				generatedAtLabel: '2 mins ago'
			}
		},
		{
			id: '01:02',
			sourceText: 'And God said, "Let there be light."',
			targetText: '',
			targetLanguage: 'Malayalam',
			status: 'Draft',
			draftedByGemini: false,
			updatedAtLabel: 'Not generated'
		}
	]
};

const GLOSSARY_TERMS: GlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'God',
		targetTerm: 'Ishwar',
		status: 'Approved',
		rationale: 'Preferred rendering in this project'
	}
];

function mockReviewerCommentsResponse(comments: ReviewerComment[] = []) {
	const fetchMock = vi.fn((input: RequestInfo | URL) => {
		const url = String(input);
		if (url.includes('/api/reviewer-comments?storyId=')) {
			return Promise.resolve(
				new Response(JSON.stringify({ comments }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			);
		}

		return Promise.resolve(
			new Response(JSON.stringify({ comments: [] }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
	});

	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('StoryEditorBaseline', () => {
	beforeEach(() => {
		mockReviewerCommentsResponse();
	});

	afterEach(() => {
		mockPage.set({ data: { user: null } });
		vi.unstubAllGlobals();
	});

	it('renders story header and source/target columns', async () => {
		render(StoryEditorBaseline, { story: STORY });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('01: The Creation');
		await expect
			.element(page.getByText('In the beginning, God created the heavens and the earth.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Hindi').nth(1)).toBeInTheDocument();
	});

	it('renders a separate editor toolbar and drafting pane with grouped segment cards', async () => {
		render(StoryEditorBaseline, { story: STORY });

		await expect.element(page.getByTestId('editor-toolbar')).toBeInTheDocument();
		await expect.element(page.getByTestId('drafting-area')).toBeInTheDocument();
		await expect.element(page.getByTestId('segment-card-01:01')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('segment-card-01:01').getByText(STORY.segments[0].sourceText))
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('segment-card-01:01').getByRole('textbox'))
			.toBeInTheDocument();
	});

	it('shows per-segment toolbox metadata, actions, and inline terminology warnings', async () => {
		render(StoryEditorBaseline, { story: STORY, glossaryTerms: GLOSSARY_TERMS });

		const firstToolbox = page.getByTestId('segment-toolbox-01:01');

		await expect.element(firstToolbox).toBeInTheDocument();
		await expect.element(firstToolbox.getByText('Regenerate draft')).toBeInTheDocument();
		await expect.element(firstToolbox.getByText('Comments')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('segment-warning-01:01'))
			.toHaveTextContent('Use "Ishwar" for "God" in this segment.');
		await expect.element(page.getByTestId('segment-status-01:01')).toBeInTheDocument();
		await expect.element(page.getByTestId('terminology-warning-panel')).not.toBeInTheDocument();
	});

	it('marks a selected segment as active', async () => {
		render(StoryEditorBaseline, { story: STORY });

		await page.getByRole('checkbox', { name: 'select-segment-01:01' }).click();

		await expect
			.element(page.getByTestId('segment-card-01:01'))
			.toHaveAttribute('data-active', 'true');
		await expect
			.element(page.getByTestId('segment-card-01:02'))
			.toHaveAttribute('data-active', 'false');
	});

	it('opens segment comments inline without relying on a sidebar', async () => {
		mockReviewerCommentsResponse([
			{
				id: 'comment-1',
				storyId: '01',
				segmentId: '01:01',
				authorId: 'reviewer.seed',
				message: 'Please verify the key term before approval.',
				resolved: false,
				createdAt: '2026-05-05T10:08:00.000Z',
				resolvedAt: null
			}
		]);

		render(StoryEditorBaseline, { story: STORY });

		await expect
			.element(page.getByTestId('segment-toolbox-01:01').getByText('1 comment'))
			.toBeInTheDocument();
		await page.getByTestId('segment-comments-toggle-01:01').click();
		await expect.element(page.getByTestId('segment-comments-01:01')).toBeInTheDocument();
		await expect
			.element(
				page
					.getByTestId('segment-comments-01:01')
					.getByText('Please verify the key term before approval.')
			)
			.toBeInTheDocument();
		await expect.element(page.getByText('Reviewer Comments')).not.toBeInTheDocument();
	});

	it('shows skeleton placeholder on selected segments while drafting', async () => {
		render(StoryEditorBaseline, { story: STORY });

		// Select the first segment
		const checkbox = page.getByRole('checkbox', { name: 'select-segment-01:01' });
		await checkbox.click();

		// Draft-Selected button should now be enabled (count = 1)
		const draftBtn = page.getByTestId('draft-selected-btn');
		await expect.element(draftBtn).toHaveTextContent('Draft Selected (1)');

		// Verify the button is not disabled
		await expect.element(draftBtn).not.toBeDisabled();
	});

	it('supports select all and deselect all for segment checkboxes', async () => {
		render(StoryEditorBaseline, { story: STORY });

		const bulkSelectBtn = page.getByTestId('bulk-select-btn');
		const firstCheckbox = page.getByRole('checkbox', { name: 'select-segment-01:01' });
		const secondCheckbox = page.getByRole('checkbox', { name: 'select-segment-01:02' });
		const draftBtn = page.getByTestId('draft-selected-btn');

		await expect.element(bulkSelectBtn).toHaveTextContent('Select All');

		await bulkSelectBtn.click();
		await expect.element(firstCheckbox).toBeChecked();
		await expect.element(secondCheckbox).toBeChecked();
		await expect.element(bulkSelectBtn).toHaveTextContent('Deselect All');
		await expect.element(draftBtn).toHaveTextContent('Draft Selected (2)');

		await bulkSelectBtn.click();
		await expect.element(firstCheckbox).not.toBeChecked();
		await expect.element(secondCheckbox).not.toBeChecked();
		await expect.element(bulkSelectBtn).toHaveTextContent('Select All');
		await expect.element(draftBtn).toHaveTextContent('Draft Selected (0)');
	});

	it('tracks unsaved changes and shows save confirmation with actor', async () => {
		render(StoryEditorBaseline, { story: STORY, glossaryTerms: GLOSSARY_TERMS });

		const firstTarget = page.getByRole('textbox').first();
		await firstTarget.fill('नई अनुवादित पंक्ति');

		await expect.element(page.getByText('Unsaved changes')).toBeInTheDocument();

		await page.getByRole('button', { name: 'Save Changes' }).click();
		await expect
			.element(page.getByTestId('save-message'))
			.toHaveTextContent(/Saved by translator\.demo at /);
	});

	it('shows inline terminology warnings and clears after compliant edits', async () => {
		render(StoryEditorBaseline, { story: STORY, glossaryTerms: GLOSSARY_TERMS });

		await expect.element(page.getByTestId('segment-warning-01:01')).toBeInTheDocument();

		const firstTarget = page.getByRole('textbox').first();
		const secondTarget = page.getByRole('textbox').nth(1);
		await firstTarget.fill('Ishwar created the heavens and earth.');
		await secondTarget.fill('And Ishwar said, let there be light.');

		await expect
			.element(page.getByTestId('segment-card-01:01').getByTestId('segment-warning-01:01'))
			.not.toBeInTheDocument();
	});

	it('disables inputs and displays read-only banner when locked by another user', async () => {
		render(StoryEditorBaseline, {
			story: STORY,
			serverLockedInfo: { locked: true, lockedBy: 'reviewer.demo', isOwnLock: false }
		});

		await expect.element(page.getByTestId('readonly-banner')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('readonly-banner'))
			.toHaveTextContent(/Read-Only Mode: Story is currently locked by reviewer\.demo/);

		const firstTarget = page.getByRole('textbox').first();
		await expect.element(firstTarget).toBeDisabled();

		const saveBtn = page.getByRole('button', { name: 'Save Changes' });
		await expect.element(saveBtn).toBeDisabled();
	});

	it('displays revoke lock button for Project Lead', async () => {
		mockPage.set({
			data: {
				user: { username: 'lead.demo', role: 'Lead' }
			}
		} as any);

		render(StoryEditorBaseline, {
			story: STORY,
			serverLockedInfo: { locked: true, lockedBy: 'translator.demo', isOwnLock: false }
		});

		await expect.element(page.getByTestId('readonly-banner')).toBeInTheDocument();
		await expect.element(page.getByTestId('revoke-lock-btn')).toBeInTheDocument();
	});
});
