export const BRAND_NAME = 'Gundert Editor';

export const LEGACY_BRAND_STRINGS = ['ScriptureForge', 'LinguistAI'];

export function assertNoLegacyBrand(value: string): boolean {
	const lower = value.toLowerCase();
	return !LEGACY_BRAND_STRINGS.some((legacy) => lower.includes(legacy.toLowerCase()));
}
