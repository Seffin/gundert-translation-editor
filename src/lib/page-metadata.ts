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
	}
};

export function getPageMetadata(pathname: string): PageMetadata {
	return PAGE_METADATA_BY_PATH[pathname] ?? PAGE_METADATA_BY_PATH['/'];
}

export function buildPageTitle(pathname: string): string {
	const metadata = getPageMetadata(pathname);
	return `${BRAND_NAME} | ${metadata.title}`;
}

export function validatePageTitle(pathname: string): boolean {
	return assertNoLegacyBrand(buildPageTitle(pathname));
}
