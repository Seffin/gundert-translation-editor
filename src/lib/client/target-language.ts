/**
 * List of supported target languages for translation.
 * These are the languages that can be selected as translation targets.
 */
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

/**
 * Default target language when no preference is set.
 */
export const DEFAULT_LANGUAGE = 'Hindi';

/**
 * Generates the localStorage key for storing a story's target language.
 * @param storyId - The story identifier
 * @returns The localStorage key
 */
function storageKey(storyId: string): string {
	return `gundler-editor:target-language:${storyId}`;
}

/**
 * Validates whether a language is in the supported languages list.
 * @param language - The language string to validate
 * @returns True if the language is supported, false otherwise
 */
export function isValidLanguage(language: string): boolean {
	return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

/**
 * Loads the target language for a specific story from localStorage.
 * Falls back to the global user preference, then to DEFAULT_LANGUAGE.
 * @param storyId - The story identifier
 * @returns The target language for the story
 */
export function loadTargetLanguage(storyId: string): string {
	try {
		const stored = globalThis.localStorage?.getItem(storageKey(storyId));
		if (stored && isValidLanguage(stored)) return stored;

		// Fallback to global user setting
		const globalStored = globalThis.localStorage?.getItem('gundler-editor:user-target-language');
		if (globalStored && isValidLanguage(globalStored)) return globalStored;
	} catch {
		// localStorage unavailable (SSR, private mode)
	}
	return DEFAULT_LANGUAGE;
}

/**
 * Saves the target language for a specific story to localStorage.
 * Silently fails if the language is invalid or localStorage is unavailable.
 * @param storyId - The story identifier
 * @param language - The target language to save
 */
export function saveTargetLanguage(storyId: string, language: string): void {
	if (!isValidLanguage(language)) return;
	try {
		globalThis.localStorage?.setItem(storageKey(storyId), language);
	} catch {
		// Ignore storage failures (SSR, private mode)
	}
}
