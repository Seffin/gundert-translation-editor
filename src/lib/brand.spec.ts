import { describe, expect, it } from 'vitest';
import { assertNoLegacyBrand, BRAND_NAME, LEGACY_BRAND_STRINGS } from '$lib/brand';

describe('brand constants', () => {
	it('uses Gundert Editor as the brand name', () => {
		expect(BRAND_NAME).toBe('Gundert Editor');
	});

	it('rejects all known legacy brand strings', () => {
		for (const legacy of LEGACY_BRAND_STRINGS) {
			expect(assertNoLegacyBrand(`App title: ${legacy}`)).toBe(false);
		}
	});
});
