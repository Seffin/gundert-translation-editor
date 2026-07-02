import { describe, expect, it } from 'vitest';
import {
	buildPageTitle,
	getPageMetadata,
	PAGE_METADATA_BY_PATH,
	validatePageTitle
} from '$lib/page-metadata';

describe('page metadata', () => {
	it('provides metadata for known routes', () => {
		expect(getPageMetadata('/').title).toBe('Workspace');
		expect(getPageMetadata('/demo').title).toBe('Demo');
		expect(getPageMetadata('/reviewer').title).toBe('Reviewer Queue');
		expect(getPageMetadata('/lead').title).toBe('Lead Approval');
		expect(getPageMetadata('/glossary').title).toBe('Glossary');
		expect(getPageMetadata('/activity').title).toBe('Activity Log');
		expect(getPageMetadata('/login').title).toBe('Login');
		expect(getPageMetadata('/pre-register').title).toBe('Apply for Access');
	});

	it('falls back to home metadata for unknown routes', () => {
		expect(getPageMetadata('/unknown').title).toBe('Workspace');
	});

	it('builds titles with Gundert Editor prefix', () => {
		expect(buildPageTitle('/')).toMatch(/^Gundert Editor \| /);
	});

	it('validates all configured routes against legacy brand strings', () => {
		for (const path of Object.keys(PAGE_METADATA_BY_PATH)) {
			expect(validatePageTitle(path)).toBe(true);
		}
	});
});
