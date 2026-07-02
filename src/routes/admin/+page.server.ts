import { db } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateSalt, hashPassword } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	// Security check: must be SuperAdmin
	if (!locals.user || locals.user.role !== 'SuperAdmin') {
		throw error(403, 'Unauthorized');
	}

	// Fetch all users in alphabetical order
	const users = (await db
		.prepare('SELECT id, username, role FROM users ORDER BY username ASC')
		.all()) as Array<{
		id: number;
		username: string;
		role: string;
	}>;

	// Fetch all pre-registrations ordered by creation time (newest first)
	const preRegistrations = (await db
		.prepare('SELECT * FROM pre_registrations ORDER BY created_at DESC')
		.all()) as Array<{
		id: number;
		email: string;
		name: string;
		requested_role: string;
		justification: string;
		status: string;
		created_at: number;
	}>;

	return {
		users,
		preRegistrations
	};
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SuperAdmin') {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const role = data.get('role')?.toString().trim();
		const password = data.get('password')?.toString().trim() || 'default123';

		if (!username || !role) {
			return fail(400, { error: 'Username and role are required' });
		}

		const allowedRoles = ['Translator', 'Reviewer', 'Lead', 'SuperAdmin'];
		if (!allowedRoles.includes(role)) {
			return fail(400, { error: 'Invalid role selected' });
		}

		try {
			// Check if user already exists
			const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
			if (existing) {
				return fail(400, { error: 'A user with this email or username already exists' });
			}

			const salt = generateSalt();
			const passwordHash = hashPassword(password, salt);

			const insertUser = db.prepare(`
				INSERT INTO users (username, password_hash, salt, role)
				VALUES (?, ?, ?, ?)
			`);
			await insertUser.run(username, passwordHash, salt, role);

			return { success: true, message: `Successfully whitelisted ${username} as ${role}` };
		} catch (err) {
			console.error('Error creating user:', err);
			return fail(500, { error: 'Failed to create user in database' });
		}
	},

	updateRole: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SuperAdmin') {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const userIdStr = data.get('userId')?.toString();
		const newRole = data.get('role')?.toString().trim();

		if (!userIdStr || !newRole) {
			return fail(400, { error: 'User ID and new role are required' });
		}

		const userId = parseInt(userIdStr, 10);
		const allowedRoles = ['Translator', 'Reviewer', 'Lead', 'SuperAdmin'];
		if (!allowedRoles.includes(newRole)) {
			return fail(400, { error: 'Invalid role' });
		}

		try {
			// Safety lock: prevent demoting the last SuperAdmin
			const currentRoleQuery = (await db
				.prepare('SELECT role FROM users WHERE id = ?')
				.get(userId)) as { role: string } | undefined;
			if (currentRoleQuery?.role === 'SuperAdmin' && newRole !== 'SuperAdmin') {
				const superAdminCountQuery = (await db
					.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'SuperAdmin'")
					.get()) as { count: number } | undefined;
				const count = superAdminCountQuery?.count ?? 0;
				if (count <= 1) {
					return fail(400, {
						error: 'Cannot demote the last remaining Super Admin to maintain system access'
					});
				}
			}

			await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
			return { success: true, message: 'User role updated successfully' };
		} catch (err) {
			console.error('Error updating user role:', err);
			return fail(500, { error: 'Failed to update role in database' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SuperAdmin') {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const userIdStr = data.get('userId')?.toString();

		if (!userIdStr) {
			return fail(400, { error: 'User ID is required' });
		}

		const userId = parseInt(userIdStr, 10);

		// Safety lock: prevent current logged-in SuperAdmin from deleting themselves
		if (userId === locals.user.id) {
			return fail(400, { error: 'You cannot delete your own Super Admin account while logged in' });
		}

		try {
			// Safety lock: prevent deleting the last SuperAdmin
			const userQuery = (await db.prepare('SELECT role FROM users WHERE id = ?').get(userId)) as
				| { role: string }
				| undefined;
			if (userQuery?.role === 'SuperAdmin') {
				const superAdminCountQuery = (await db
					.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'SuperAdmin'")
					.get()) as { count: number } | undefined;
				const count = superAdminCountQuery?.count ?? 0;
				if (count <= 1) {
					return fail(400, {
						error: 'Cannot delete the last remaining Super Admin to maintain system access'
					});
				}
			}

			// Delete sessions first
			await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
			// Delete user
			await db.prepare('DELETE FROM users WHERE id = ?').run(userId);

			return { success: true, message: 'User account deleted successfully' };
		} catch (err) {
			console.error('Error deleting user:', err);
			return fail(500, { error: 'Failed to delete user from database' });
		}
	},

	approveRequest: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SuperAdmin') {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const requestIdStr = data.get('requestId')?.toString();
		const email = data.get('email')?.toString().trim();
		const requestedRole = data.get('role')?.toString().trim();

		if (!requestIdStr || !email || !requestedRole) {
			return fail(400, { error: 'Request ID, email and role are required' });
		}

		const requestId = parseInt(requestIdStr, 10);

		try {
			// Find the pre-registration request
			const preRegs = await db.prepare('SELECT * FROM pre_registrations').all();
			const req = preRegs.find((r: any) => r.id === requestId);
			if (!req) {
				return fail(404, { error: 'Access request not found' });
			}

			// Update the status of pre-registration request to Approved
			await db
				.prepare('UPDATE pre_registrations SET status = ? WHERE id = ?')
				.run('Approved', requestId);

			// Check if user already exists
			const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(email);
			let defaultPassword = '';
			if (!existing) {
				const salt = generateSalt();
				// Generate a secure fallback password
				defaultPassword = Math.random().toString(36).substring(2, 12);
				const passwordHash = hashPassword(defaultPassword, salt);

				const insertUser = db.prepare(`
					INSERT INTO users (username, password_hash, salt, role)
					VALUES (?, ?, ?, ?)
				`);
				await insertUser.run(email, passwordHash, salt, requestedRole);
			} else {
				// If user already exists, update their role to the requested role
				await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(requestedRole, existing.id);
			}

			const passwordMessage = defaultPassword ? `. Temporary password is "${defaultPassword}"` : '';

			return {
				success: true,
				message: `Successfully approved request and whitelisted ${email} as ${requestedRole}${passwordMessage}`
			};
		} catch (err) {
			console.error('Error approving request:', err);
			return fail(500, { error: 'Failed to approve access request' });
		}
	},

	rejectRequest: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SuperAdmin') {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const requestIdStr = data.get('requestId')?.toString();

		if (!requestIdStr) {
			return fail(400, { error: 'Request ID is required' });
		}

		const requestId = parseInt(requestIdStr, 10);

		try {
			// Find the pre-registration request
			const preRegs = await db.prepare('SELECT * FROM pre_registrations').all();
			const req = preRegs.find((r: any) => r.id === requestId);
			if (!req) {
				return fail(404, { error: 'Access request not found' });
			}

			// Update the status of pre-registration request to Rejected
			await db
				.prepare('UPDATE pre_registrations SET status = ? WHERE id = ?')
				.run('Rejected', requestId);

			return { success: true, message: `Successfully rejected access request for ${req.email}` };
		} catch (err) {
			console.error('Error rejecting request:', err);
			return fail(500, { error: 'Failed to reject access request' });
		}
	}
};
