import { db } from '$lib/server/db';
import type { DBUser } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';

export const GET: RequestHandler = async ({ url, cookies }) => {
	let email = '';
	let name = '';

	const code = url.searchParams.get('code');
	const mockEmail = url.searchParams.get('email');
	const mockName = url.searchParams.get('name');

	if (mockEmail) {
		// Mock developer loop input
		email = mockEmail;
		name = mockName || '';
	} else {
		// Real Google OAuth 2.0 Auth Exchange
		const clientId = process.env.GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
		const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

		if (!code) {
			throw redirect(303, '/login?error=no_auth_code');
		}

		try {
			// Exchange authorization code for access token
			const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: clientId || '',
					client_secret: clientSecret || '',
					redirect_uri: redirectUri,
					grant_type: 'authorization_code'
				})
			});

			if (!tokenRes.ok) {
				const errBody = await tokenRes.text();
				console.error('Google token exchange failed:', errBody);
				throw redirect(303, '/login?error=token_exchange_failed');
			}

			const tokens = await tokenRes.json();
			const accessToken = tokens.access_token;

			// Retrieve profile info
			const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			if (!profileRes.ok) {
				throw redirect(303, '/login?error=profile_fetch_failed');
			}

			const profile = await profileRes.json();
			email = profile.email;
			name = profile.name || '';
		} catch (err) {
			if (err instanceof Response || (typeof err === 'object' && err !== null && 'status' in err)) {
				throw err; // Re-throw SvelteKit redirects
			}
			console.error('Google oauth callback error:', err);
			throw redirect(303, '/login?error=google_auth_failed');
		}
	}

	// Clean email format
	email = email.toLowerCase().trim();

	try {
		// Check if email matches a whitelisted user in DB
		const getUser = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?');
		const user = await getUser.get(email) as DBUser | undefined;

		if (user) {
			// Generate session token
			const sessionId = randomBytes(24).toString('hex');
			const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiration

			// Insert session
			const insertSession = db.prepare(`
				INSERT INTO sessions (id, user_id, expires_at)
				VALUES (?, ?, ?)
			`);
			await insertSession.run(sessionId, user.id, expiresAt);

			const isHttps = url.protocol === 'https:' || url.hostname !== 'localhost';

			// Set session cookie
			cookies.set('gundert_session', sessionId, {
				path: '/',
				httpOnly: true,
				secure: !dev && isHttps,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 // 24 hours in seconds
			});

			// Route user to respective workspace
			const role = user.role;
			if (role === 'SuperAdmin') {
				throw redirect(303, '/admin');
			} else if (role === 'Lead') {
				throw redirect(303, '/lead');
			} else if (role === 'Reviewer') {
				throw redirect(303, '/reviewer');
			} else {
				throw redirect(303, '/stories');
			}
		} else {
			// Not whitelisted yet. Verify if already pending in request queue
			const checkPreReg = db.prepare('SELECT status FROM pre_registrations WHERE email = ?');
			const preReg = await checkPreReg.get(email) as { status: string } | undefined;

			const preRegUrl = new URL(`${url.origin}/pre-register`);
			preRegUrl.searchParams.set('email', email);
			if (name) {
				preRegUrl.searchParams.set('name', name);
			}
			if (preReg) {
				preRegUrl.searchParams.set('status', preReg.status);
			}
			throw redirect(303, preRegUrl.toString());
		}
	} catch (err) {
		if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
			throw err; // Re-throw SvelteKit redirects
		}
		console.error('Database callback verification error:', err);
		throw redirect(303, '/login?error=database_error');
	}
};
