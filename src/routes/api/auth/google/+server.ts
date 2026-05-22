import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	// Fallback to Mock Google Authentication loop if credentials are not configured
	if (!clientId || !clientSecret) {
		console.warn('Google Client credentials missing. Activating Mock Google Auth Simulator.');
		throw redirect(302, '/api/auth/google/simulator');
	}

	const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

	const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	oauthUrl.searchParams.set('client_id', clientId);
	oauthUrl.searchParams.set('redirect_uri', redirectUri);
	oauthUrl.searchParams.set('response_type', 'code');
	oauthUrl.searchParams.set('scope', 'openid email profile');
	oauthUrl.searchParams.set('state', 'secure_random_state_string_123');
	oauthUrl.searchParams.set('access_type', 'offline');
	oauthUrl.searchParams.set('prompt', 'consent');

	throw redirect(302, oauthUrl.toString());
};
