export const SUPPORTED_LANGUAGES: readonly string[] = [
	'Amharic',
	'Assamese',
	'Bengali',
	'Gujarati',
	'Hindi',
	'Indonesian',
	'Kannada',
	'Malay',
	'Malayalam',
	'Marathi',
	'Nepali',
	'Odia',
	'Punjabi',
	'Sinhala',
	'Swahili',
	'Tamil',
	'Telugu',
	'Urdu'
] as const;

export const DEFAULT_LANGUAGE = 'Hindi';

function storageKey(storyId: string): string {
	return `gundert-editor:target-language:${storyId}`;
}

export function isValidLanguage(language: string): boolean {
	return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

export function loadTargetLanguage(storyId: string): string {
	try {
		const stored = globalThis.localStorage?.getItem(storageKey(storyId));
		if (stored && isValidLanguage(stored)) return stored;
	} catch {
		// localStorage unavailable (SSR, private mode)
	}
	return DEFAULT_LANGUAGE;
}

export function saveTargetLanguage(storyId: string, language: string): void {
	if (!isValidLanguage(language)) return;
	try {
		globalThis.localStorage?.setItem(storageKey(storyId), language);
	} catch {
		// Ignore storage failures
	}
}
