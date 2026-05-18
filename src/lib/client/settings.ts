import { DEFAULT_LANGUAGE } from './target-language';

const TARGET_STORAGE_KEY = 'gundert-editor:user-target-language';

export const DEFAULT_SOURCE_LANGUAGE = 'English';

export function loadSourceLanguage(): string {
	return DEFAULT_SOURCE_LANGUAGE;
}

export function loadGlobalTargetLanguage(): string {
	try {
		const stored = globalThis.localStorage?.getItem(TARGET_STORAGE_KEY);
		if (stored) return stored;
	} catch {
		// localStorage unavailable
	}
	return DEFAULT_LANGUAGE;
}

export function saveGlobalTargetLanguage(language: string): void {
	try {
		globalThis.localStorage?.setItem(TARGET_STORAGE_KEY, language);
	} catch {
		// Ignore storage failures
	}
}

const THEME_STORAGE_KEY = 'gundert-editor:theme';
export const API_KEY_STORAGE_KEY = 'gundert-editor:api-key';

export type Theme = 'system' | 'light' | 'dark';

export function loadTheme(): Theme {
	try {
		const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	} catch {
		// localStorage unavailable
	}
	return 'system';
}

export function saveTheme(theme: Theme): void {
	try {
		globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Ignore storage failures
	}
}

export function loadApiKey(): string {
	try {
		return globalThis.localStorage?.getItem(API_KEY_STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

export function saveApiKey(key: string): void {
	try {
		globalThis.localStorage?.setItem(API_KEY_STORAGE_KEY, key);
	} catch {
		// Ignore storage failures
	}
}

export function clearApiKey(): void {
	try {
		globalThis.localStorage?.removeItem(API_KEY_STORAGE_KEY);
	} catch {
		// Ignore storage failures
	}
}
