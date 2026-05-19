import { expect, test } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:4173';

const INDIC_TEXT = {
	Hindi: 'परमेश्वर ने आकाश और पृथ्वी की सृष्टि की।',
	Malayalam: 'ദൈവം ആകാശവും ഭൂമിയും സൃഷ്ടിച്ചു.',
	Tamil: 'தேவன் வானத்தையும் பூமியையும் படைத்தார்.'
} as const;

async function openStoryEditor(page: Parameters<typeof test>[0]['page']) {
	await page.goto(`${APP_URL}/stories/01`);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByTestId('language-selector')).toBeVisible();
}

test('uses Tamil in Gemini chunk prompt and preserves selection after reload', async ({ page }) => {
	let capturedPrompt = '';

	await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
		const postData = route.request().postDataJSON() as {
			contents?: Array<{ parts?: Array<{ text?: string }> }>;
		};
		capturedPrompt = postData.contents?.[0]?.parts?.[0]?.text ?? '';

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				candidates: [
					{
						content: {
							parts: [{ text: INDIC_TEXT.Tamil }]
						},
						finishReason: 'STOP'
					}
				]
			})
		});
	});

	await openStoryEditor(page);

	await page.getByTestId('language-selector').selectOption('Tamil');
	await page.locator('input[aria-label^="select-segment-"]').first().check();
	await page.getByTestId('draft-selected-btn').click();

	await expect(page.locator('textarea').first()).toHaveValue(INDIC_TEXT.Tamil);
	expect(capturedPrompt).toContain('Tamil');
	await expect(page.locator('.provenance').first()).toContainText('AI DRAFT');
	await page.getByRole('button', { name: 'Save Changes' }).click();
	await expect(page.getByTestId('save-message')).toBeVisible();

	await page.reload();
	await expect(page.getByTestId('language-selector')).toHaveValue('Tamil');
	await expect(page.locator('textarea').first()).toHaveValue(INDIC_TEXT.Tamil);
	await expect(page.locator('.language-chip').first()).toContainText('Tamil');
});

test('renders Hindi, Malayalam, and Tamil text without replacement glyphs or horizontal overflow', async ({
	page
}) => {
	await openStoryEditor(page);

	const textareas = page.locator('textarea');
	await textareas.nth(0).fill(INDIC_TEXT.Hindi);
	await textareas.nth(1).fill(INDIC_TEXT.Malayalam);
	await textareas.nth(2).fill(INDIC_TEXT.Tamil);
	await page.getByRole('button', { name: 'Save Changes' }).click();
	await expect(page.getByTestId('save-message')).toBeVisible();

	await page.reload();

	await expect(textareas.nth(0)).toHaveValue(INDIC_TEXT.Hindi);
	await expect(textareas.nth(1)).toHaveValue(INDIC_TEXT.Malayalam);
	await expect(textareas.nth(2)).toHaveValue(INDIC_TEXT.Tamil);

	for (const sample of Object.values(INDIC_TEXT)) {
		await expect(page.locator('textarea')).not.toContainText('\uFFFD');
		expect(sample.includes('\uFFFD')).toBe(false);
	}

	const overflowState = await textareas.evaluateAll((elements) =>
		elements.slice(0, 3).map((element) => {
			const textarea = element as HTMLTextAreaElement;
			return {
				scrollWidth: textarea.scrollWidth,
				clientWidth: textarea.clientWidth
			};
		})
	);

	for (const state of overflowState) {
		expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 2);
	}
});
