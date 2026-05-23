import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const email = url.searchParams.get('email')?.toLowerCase().trim() || '';
	const name = url.searchParams.get('name')?.trim() || '';
	const status = url.searchParams.get('status')?.trim() || '';

	return {
		email,
		name,
		status
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().toLowerCase().trim();
		const name = data.get('name')?.toString().trim();
		const requestedRole = data.get('role')?.toString().trim();
		const justification = data.get('justification')?.toString().trim() || '';

		if (!email || !name || !requestedRole) {
			return fail(400, { error: 'Email, name, and requested role are required.' });
		}

		if (!email.includes('@')) {
			return fail(400, { error: 'Please provide a valid email address.' });
		}

		const allowedRoles = ['Translator', 'Reviewer', 'Lead'];
		if (!allowedRoles.includes(requestedRole)) {
			return fail(400, { error: 'Invalid workspace role selected.' });
		}

		try {
			// Verify if user already exists in whitelisted users
			const checkUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?');
			const existingUser = await checkUser.get(email);
			if (existingUser) {
				return fail(400, { error: 'Your email is already registered and whitelisted! Please go to the login screen and sign in.' });
			}

			// Verify if user already has a pending pre-registration request
			const checkReq = db.prepare('SELECT status FROM pre_registrations WHERE email = ?');
			const existingReq = await checkReq.get(email) as { status: string } | undefined;
			if (existingReq) {
				return fail(400, { 
					error: `An access request for this email already exists with status: "${existingReq.status}".` 
				});
			}

			// Insert pre-registration
			const insertReq = db.prepare(`
				INSERT INTO pre_registrations (email, name, requested_role, justification, status, created_at)
				VALUES (?, ?, ?, ?, ?, ?)
			`);
			await insertReq.run(email, name, requestedRole, justification, 'Pending', Date.now());

			return { success: true, message: 'Your application has been successfully submitted! A Super Admin will review your request shortly.' };
		} catch (err) {
			console.error('Pre-registration submission failure:', err);
			return fail(500, { error: 'An unexpected database error occurred. Please try again later.' });
		}
	}
};
