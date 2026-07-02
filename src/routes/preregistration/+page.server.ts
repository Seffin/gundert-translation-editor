import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const email = url.searchParams.get('email') || '';
	const name = url.searchParams.get('name') || '';
	const status = url.searchParams.get('status') || '';

	const redirectUrl = new URL(url.origin + '/pre-register');
	if (email) redirectUrl.searchParams.set('email', email);
	if (name) redirectUrl.searchParams.set('name', name);
	if (status) redirectUrl.searchParams.set('status', status);

	throw redirect(307, redirectUrl.pathname + redirectUrl.search);
};
