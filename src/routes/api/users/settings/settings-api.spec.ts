import { describe, expect, it } from 'vitest';
import { POST } from './+server';
import { db } from '$lib/server/db';
import type { DBUser } from '$lib/server/db';

describe('Settings save API endpoint', () => {
	it('should return 401 Unauthorized if not logged in', async () => {
		const request = {
			json: async () => ({ targetLanguage: 'Malayalam' })
		} as unknown as Request;

		const response = await POST({ locals: { user: null }, request } as any);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe('Unauthorized');
	});

	it('should return 400 Bad Request if targetLanguage is missing or unsupported', async () => {
		const requestMissing = {
			json: async () => ({})
		} as unknown as Request;

		const response1 = await POST({ locals: { user: { id: 1 } }, request: requestMissing } as any);
		const data1 = await response1.json();
		expect(response1.status).toBe(400);
		expect(data1.error).toContain('Missing targetLanguage');

		const requestUnsupported = {
			json: async () => ({ targetLanguage: 'InvalidLanguage' })
		} as unknown as Request;

		const response2 = await POST({
			locals: { user: { id: 1 } },
			request: requestUnsupported
		} as any);
		const data2 = await response2.json();
		expect(response2.status).toBe(400);
		expect(data2.error).toContain('Unsupported target language');
	});

	it('should successfully update user target language preference in database', async () => {
		const getUser = db.prepare('SELECT id FROM users WHERE username = ?');
		const user = (await getUser.get('translator.demo')) as DBUser;
		expect(user).toBeDefined();

		const request = {
			json: async () => ({ targetLanguage: 'Malayalam' })
		} as unknown as Request;

		const response = await POST({ locals: { user: { id: user.id } }, request } as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.targetLanguage).toBe('Malayalam');

		// Verify change in the database
		const verifyUser = db.prepare('SELECT target_language FROM users WHERE id = ?');
		const updated = (await verifyUser.get(user.id)) as any;
		expect(updated.target_language).toBe('Malayalam');

		// Reset settings back to null
		const clearTarget = db.prepare('UPDATE users SET target_language = NULL WHERE id = ?');
		await clearTarget.run(user.id);
	});
});
