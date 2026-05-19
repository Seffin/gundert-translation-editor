import { buildPageTitle, getPageMetadata } from '$lib/page-metadata';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
	const metadata = getPageMetadata(url.pathname);

	return {
		pageTitle: buildPageTitle(url.pathname),
		description: metadata.description
	};
};
