import { db, hashPassword } from '$lib/server/db';
import type { DBUser } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Username and password are required' }, { status: 400 });
		}

		// Find user
		const getUser = db.prepare('SELECT * FROM users WHERE username = ?');
		const user = (await getUser.get(username)) as DBUser | undefined;

		if (!user) {
			return json({ error: 'Invalid username or password' }, { status: 400 });
		}

		// Verify password hash
		const hashedInput = hashPassword(password, user.salt);
		if (hashedInput !== user.password_hash) {
			return json({ error: 'Invalid username or password' }, { status: 400 });
		}

		// Generate session token
		const sessionId = randomBytes(24).toString('hex');
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiration

		// Insert session
		const insertSession = db.prepare(`
			INSERT INTO sessions (id, user_id, expires_at)
			VALUES (?, ?, ?)
		`);
		await insertSession.run(sessionId, user.id, expiresAt);

		const isHttps =
			url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

		// Set httpOnly session cookie
		cookies.set('gundert_session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: !dev && isHttps,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 24 hours in seconds
		});

		return json({
			success: true,
			user: {
				id: user.id,
				username: user.username,
				role: user.role
			}
		});
	} catch (error) {
		console.error('API login error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown authentication error' },
			{ status: 500 }
		);
	}
};
