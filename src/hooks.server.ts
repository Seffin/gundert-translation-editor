import { db, initializeDatabase } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

let dbInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		try {
			await initializeDatabase();
			dbInitialized = true;
		} catch (err) {
			console.error('Failed to initialize database:', err);
		}
	}

	const sessionCookie = event.cookies.get('gundert_session');
	event.locals.user = null;

	if (sessionCookie) {
		try {
			const stmt = db.prepare(`
				SELECT s.id, s.expires_at, u.id as user_id, u.username, u.role
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.id = ?
			`);
			const session = await stmt.get(sessionCookie) as { id: string; expires_at: number; user_id: number; username: string; role: string } | undefined;

			if (session) {
				if (session.expires_at > Date.now()) {
					event.locals.user = {
						id: session.user_id,
						username: session.username,
						role: session.role
					};
				} else {
					// Session expired
					const delStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
					await delStmt.run(sessionCookie);
					event.cookies.delete('gundert_session', { path: '/' });
				}
			}
		} catch (err) {
			console.error('Hooks session lookup error:', err);
		}
	}

	const url = event.url;
	const path = url.pathname;

	// Public vs Protected Route boundaries
	const isAuthApi = path.startsWith('/api/auth');
	const isDemo = path.startsWith('/demo');
	const isLogin = path === '/login';
	// Let SvelteKit's dev assets, standard static assets, and favicon run public
	const isStaticAsset = path.includes('.') || path.startsWith('/favicon') || path.startsWith('/src') || path.startsWith('/@') || path.startsWith('/node_modules') || path.startsWith('/static');

	const isPublic = isLogin || isDemo || isAuthApi || isStaticAsset;

	if (!event.locals.user) {
		// Unauthenticated
		if (!isPublic) {
			if (path.startsWith('/api')) {
				throw error(401, 'Unauthorized');
			}
			throw redirect(303, '/login');
		}
	} else {
		// Authenticated
		const role = event.locals.user.role;

		// Prevent accessing login if already authenticated
		if (isLogin) {
			if (role === 'SuperAdmin') {
				throw redirect(303, '/admin');
			} else if (role === 'Lead') {
				throw redirect(303, '/lead');
			} else if (role === 'Reviewer') {
				throw redirect(303, '/reviewer');
			} else {
				throw redirect(303, '/stories');
			}
		}

		// Enforce Role Gates
		if (path.startsWith('/admin') && role !== 'SuperAdmin') {
			throw error(403, 'Access Denied: Super Admin role required.');
		}

		if (path.startsWith('/lead') && role !== 'Lead' && role !== 'SuperAdmin') {
			throw error(403, 'Access Denied: Project Lead role required.');
		}

		if (path.startsWith('/reviewer') && role !== 'Reviewer' && role !== 'SuperAdmin') {
			throw error(403, 'Access Denied: Reviewer role required.');
		}

		// Translators can access '/', '/stories', '/glossary', '/settings'
		if ((path === '/' || path.startsWith('/stories') || path.startsWith('/glossary')) && role !== 'Translator' && role !== 'SuperAdmin') {
			if (role === 'Lead') {
				throw redirect(303, '/lead');
			} else if (role === 'Reviewer') {
				throw redirect(303, '/reviewer');
			} else if (role === 'SuperAdmin') {
				throw redirect(303, '/admin');
			}
		}
	}

	return resolve(event);
};
