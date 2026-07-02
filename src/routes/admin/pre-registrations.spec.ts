import { describe, it, expect } from 'vitest';
import { actions } from './+page.server';
import { db } from '$lib/server/db';

describe('Admin pre-registrations approval actions', () => {
	it('should forbid non-SuperAdmin from executing approval actions', async () => {
		const request = {
			formData: async () => new FormData()
		} as unknown as Request;

		// Try without user
		await expect(actions.approveRequest({ request, locals: {} } as any)).rejects.toMatchObject({
			status: 403
		});

		// Try with Translator role
		await expect(
			actions.approveRequest({
				request,
				locals: { user: { id: 1, username: 'translator.demo', role: 'Translator' } }
			} as any)
		).rejects.toMatchObject({ status: 403 });
	});

	it('should allow SuperAdmin to approve a pre-registration request and whitelist user', async () => {
		const uniqueEmail = `scholar-${Math.random().toString(36).substring(7)}@gmail.com`;

		// Seed a pending pre-registration request
		await db
			.prepare(
				'INSERT INTO pre_registrations (email, name, requested_role, justification, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
			)
			.run(
				uniqueEmail,
				'Scholar Heidelberg',
				'Reviewer',
				'I am an OBS scholar.',
				'Pending',
				Date.now()
			);

		// Query request to get its ID
		const savedReq = (await db
			.prepare('SELECT * FROM pre_registrations WHERE email = ?')
			.get(uniqueEmail)) as any;
		expect(savedReq).toBeDefined();

		const formData = new FormData();
		formData.append('requestId', savedReq!.id.toString());
		formData.append('email', uniqueEmail);
		formData.append('role', 'Reviewer');

		const request = {
			formData: async () => formData
		} as unknown as Request;

		const result = await actions.approveRequest({
			request,
			locals: { user: { id: 4, username: 'admin.demo', role: 'SuperAdmin' } }
		} as any);

		expect(result).toBeDefined();
		expect(result.success).toBe(true);
		expect(result.message).toContain('Successfully approved');

		// Verify registration status updated to Approved
		const updatedReq = (await db
			.prepare('SELECT * FROM pre_registrations WHERE email = ?')
			.get(uniqueEmail)) as any;
		expect(updatedReq.status).toBe('Approved');

		// Verify user was successfully whitelisted in users table
		const whitelisted = await db.prepare('SELECT * FROM users WHERE username = ?').get(uniqueEmail);
		expect(whitelisted).toBeDefined();
		expect(whitelisted.role).toBe('Reviewer');
	});

	it('should allow SuperAdmin to reject a pre-registration request', async () => {
		const uniqueEmail = `rejected-${Math.random().toString(36).substring(7)}@gmail.com`;

		// Seed a pending pre-registration request
		await db
			.prepare(
				'INSERT INTO pre_registrations (email, name, requested_role, justification, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
			)
			.run(
				uniqueEmail,
				'Rejected Applicant',
				'Translator',
				'Not enough info.',
				'Pending',
				Date.now()
			);

		const savedReq = (await db
			.prepare('SELECT * FROM pre_registrations WHERE email = ?')
			.get(uniqueEmail)) as any;

		const formData = new FormData();
		formData.append('requestId', savedReq!.id.toString());

		const request = {
			formData: async () => formData
		} as unknown as Request;

		const result = await actions.rejectRequest({
			request,
			locals: { user: { id: 4, username: 'admin.demo', role: 'SuperAdmin' } }
		} as any);

		expect(result).toBeDefined();
		expect(result.success).toBe(true);
		expect(result.message).toContain('Successfully rejected');

		// Verify registration status updated to Rejected
		const updatedReq = (await db
			.prepare('SELECT * FROM pre_registrations WHERE email = ?')
			.get(uniqueEmail)) as any;
		expect(updatedReq.status).toBe('Rejected');
	});
});
