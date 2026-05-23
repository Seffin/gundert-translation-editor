import { buildPageTitle, getPageMetadata } from '$lib/page-metadata';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url, data }) => {
	const metadata = getPageMetadata(url.pathname);

	return {
		...data,
		pageTitle: buildPageTitle(url.pathname),
		description: metadata.description
	};
};
