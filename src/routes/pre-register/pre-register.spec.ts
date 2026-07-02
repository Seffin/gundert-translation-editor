import { describe, it, expect } from 'vitest';
import { actions } from './+page.server';
import { db } from '$lib/server/db';

describe('Pre-registration server actions', () => {
	it('should successfully submit a pre-registration with valid data', async () => {
		const uniqueEmail = `test-prereg-${Math.random().toString(36).substring(7)}@gmail.com`;
		const formData = new FormData();
		formData.append('email', uniqueEmail);
		formData.append('name', 'Test Applicant');
		formData.append('role', 'Translator');
		formData.append('justification', 'I want to help translate the OBS stories.');

		const request = {
			formData: async () => formData
		} as unknown as Request;

		const result = await actions.default({ request } as any);

		expect(result).toBeDefined();
		expect(result.success).toBe(true);
		expect(result.message).toContain('successfully submitted');

		// Verify in the database
		const saved = (await db
			.prepare('SELECT * FROM pre_registrations WHERE email = ?')
			.get(uniqueEmail)) as any;
		expect(saved).toBeDefined();
		expect(saved.name).toBe('Test Applicant');
		expect(saved.requested_role).toBe('Translator');
		expect(saved.status).toBe('Pending');
	});

	it('should fail if email already has a pending pre-registration', async () => {
		const uniqueEmail = `test-duplicate-${Math.random().toString(36).substring(7)}@gmail.com`;

		// Seed first request
		const f1 = new FormData();
		f1.append('email', uniqueEmail);
		f1.append('name', 'Test Applicant');
		f1.append('role', 'Translator');

		const r1 = {
			formData: async () => f1
		} as unknown as Request;
		await actions.default({ request: r1 } as any);

		// Try duplicate
		const f2 = new FormData();
		f2.append('email', uniqueEmail);
		f2.append('name', 'Duplicate User');
		f2.append('role', 'Reviewer');

		const r2 = {
			formData: async () => f2
		} as unknown as Request;

		const result = await actions.default({ request: r2 } as any);

		expect(result).toBeDefined();
		expect(result.status).toBe(400);
		expect(result.data.error).toContain('already exists');
	});
});
