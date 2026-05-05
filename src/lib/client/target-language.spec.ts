import { beforeEach, describe, expect, it } from 'vitest';
import {
	DEFAULT_LANGUAGE,
	isValidLanguage,
	loadTargetLanguage,
	saveTargetLanguage,
	SUPPORTED_LANGUAGES
} from '$lib/client/target-language';

// In-memory localStorage mock for Node test environment
function makeLocalStorageMock() {
	const store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, val: string) => { store[key] = val; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
	};
}

describe('target language', () => {
	beforeEach(() => {
		// Reset mock localStorage before each test
		(globalThis as unknown as Record<string, unknown>).localStorage = makeLocalStorageMock();
	});

	it('provides a non-empty list of supported languages', () => {
		expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
		expect(SUPPORTED_LANGUAGES).toContain('Hindi');
		expect(SUPPORTED_LANGUAGES).toContain('Tamil');
		expect(SUPPORTED_LANGUAGES).toContain('Malayalam');
		expect(SUPPORTED_LANGUAGES).toContain('Swahili');
	});

	it('validates supported and unsupported language strings', () => {
		expect(isValidLanguage('Hindi')).toBe(true);
		expect(isValidLanguage('Tamil')).toBe(true);
		expect(isValidLanguage('Klingon')).toBe(false);
		expect(isValidLanguage('')).toBe(false);
		expect(isValidLanguage('hindi')).toBe(false); // case-sensitive
	});

	it('returns default language when nothing is stored', () => {
		const lang = loadTargetLanguage('story-99');
		expect(lang).toBe(DEFAULT_LANGUAGE);
	});

	it('persists and retrieves target language by storyId', () => {
		saveTargetLanguage('story-01', 'Tamil');
		expect(loadTargetLanguage('story-01')).toBe('Tamil');
	});

	it('ignores invalid language on save and returns default', () => {
		saveTargetLanguage('story-02', 'Klingon');
		expect(loadTargetLanguage('story-02')).toBe(DEFAULT_LANGUAGE);
	});

	it('isolates language selection per storyId', () => {
		saveTargetLanguage('story-A', 'Telugu');
		saveTargetLanguage('story-B', 'Bengali');
		expect(loadTargetLanguage('story-A')).toBe('Telugu');
		expect(loadTargetLanguage('story-B')).toBe('Bengali');
	});
});
