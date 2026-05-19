import { DEFAULT_LANGUAGE } from './target-language';

const TARGET_STORAGE_KEY = 'gundler-editor:user-target-language';

export const DEFAULT_SOURCE_LANGUAGE = 'English';

/**
 * Returns the fixed source language for all translations.
 * Currently hardcoded to English as content is only available in English.
 * @returns The source language string ("English")
 */
export function loadSourceLanguage(): string {
	return DEFAULT_SOURCE_LANGUAGE;
}

/**
 * Loads the user's global target language preference from localStorage.
 * Falls back to DEFAULT_LANGUAGE if no preference is stored or localStorage is unavailable.
 * @returns The user's preferred target language or the default
 */
export function loadGlobalTargetLanguage(): string {
	try {
		const stored = globalThis.localStorage?.getItem(TARGET_STORAGE_KEY);
		if (stored) return stored;
	} catch {
		// localStorage unavailable (SSR, private mode)
	}
	return DEFAULT_LANGUAGE;
}

/**
 * Saves the user's global target language preference to localStorage.
 * Silently fails if localStorage is unavailable.
 * @param language - The target language to save
 */
export function saveGlobalTargetLanguage(language: string): void {
	try {
		globalThis.localStorage?.setItem(TARGET_STORAGE_KEY, language);
	} catch {
		// Ignore storage failures (SSR, private mode)
	}
}

const THEME_STORAGE_KEY = 'gundler-editor:theme';
export const API_KEY_STORAGE_KEY = 'gundler-editor:api-key';

export type Theme = 'system' | 'light' | 'dark';

/**
 * Loads the user's theme preference from localStorage.
 * Falls back to 'system' if no preference is stored or localStorage is unavailable.
 * @returns The user's theme preference or 'system'
 */
export function loadTheme(): Theme {
	try {
		const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	} catch {
		// localStorage unavailable (SSR, private mode)
	}
	return 'system';
}

/**
 * Saves the user's theme preference to localStorage.
 * Silently fails if localStorage is unavailable.
 * @param theme - The theme to save ('system', 'light', or 'dark')
 */
export function saveTheme(theme: Theme): void {
	try {
		globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Ignore storage failures (SSR, private mode)
	}
}

/**
 * Loads the user's Gemini API key from localStorage.
 * Returns empty string if no key is stored or localStorage is unavailable.
 * @returns The API key or empty string
 */
export function loadApiKey(): string {
	try {
		return globalThis.localStorage?.getItem(API_KEY_STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

/**
 * Saves the user's Gemini API key to localStorage.
 * Silently fails if localStorage is unavailable.
 * @param key - The API key to save
 */
export function saveApiKey(key: string): void {
	try {
		globalThis.localStorage?.setItem(API_KEY_STORAGE_KEY, key);
	} catch {
		// Ignore storage failures (SSR, private mode)
	}
}

/**
 * Removes the user's Gemini API key from localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function clearApiKey(): void {
	try {
		globalThis.localStorage?.removeItem(API_KEY_STORAGE_KEY);
	} catch {
		// Ignore storage failures (SSR, private mode)
	}
}
