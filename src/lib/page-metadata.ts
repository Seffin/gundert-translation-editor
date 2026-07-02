import { assertNoLegacyBrand, BRAND_NAME } from '$lib/brand';

export type PageMetadata = {
	title: string;
	description: string;
};

export const PAGE_METADATA_BY_PATH: Record<string, PageMetadata> = {
	'/': {
		title: 'Workspace',
		description: 'AI-assisted OBS translation workspace'
	},
	'/demo': {
		title: 'Demo',
		description: 'Demo pages for development checks'
	},
	'/demo/playwright': {
		title: 'Playwright Demo',
		description: 'End-to-end test demo route'
	},
	'/stories': {
		title: 'Story List',
		description: 'Open Bible Stories translation workflow list'
	},
	'/reviewer': {
		title: 'Reviewer Queue',
		description: 'Reviewer workflow queue for resolving in-review stories'
	},
	'/lead': {
		title: 'Lead Approval',
		description: 'Project lead approval queue with review blocker gating'
	},
	'/glossary': {
		title: 'Glossary',
		description: 'Glossary management for adding and editing translation terms'
	},
	'/activity': {
		title: 'Activity Log',
		description: 'Audit feed with actor, action, and date filters'
	},
	'/login': {
		title: 'Login',
		description: 'Access the Gundert OBS translation workspace'
	},
	'/pre-register': {
		title: 'Apply for Access',
		description: 'Apply for workspace access to the OBS translation editor'
	}
};

export function getPageMetadata(pathname: string): PageMetadata {
	if (/^\/stories\/\d{2}$/.test(pathname)) {
		return {
			title: 'Story Editor',
			description: 'Source and target editor for OBS story translation'
		};
	}

	return PAGE_METADATA_BY_PATH[pathname] ?? PAGE_METADATA_BY_PATH['/'];
}

export function buildPageTitle(pathname: string): string {
	const metadata = getPageMetadata(pathname);
	return `${BRAND_NAME} | ${metadata.title}`;
}

export function validatePageTitle(pathname: string): boolean {
	return assertNoLegacyBrand(buildPageTitle(pathname));
}
