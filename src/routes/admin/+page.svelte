<script lang="ts">
	import { BRAND_NAME } from '$lib/brand';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let usernameInput = $state('');
	let roleInput = $state('Translator');
	let passwordInput = $state('');
	let showPassword = $state(false);

	let loading = $state(false);
	let message = $derived(form?.message || form?.error || '');
	let isError = $derived(!!form?.error);

	const roles = [
		{ id: 'Translator', name: 'Translator', desc: 'Translate segments & view glossary' },
		{ id: 'Reviewer', name: 'Reviewer', desc: 'Approve segment drafts & leave comments' },
		{ id: 'Lead', name: 'Project Lead', desc: 'Approve, publish & oversee stories' },
		{ id: 'SuperAdmin', name: 'Super Admin', desc: 'Universal platform administration' }
	];
</script>

<div class="admin-viewport">
	<div class="glow-bg-1"></div>
	<div class="glow-bg-2"></div>

	<div class="admin-wrapper">
		<header class="admin-header">
			<span class="logo-badge">System Core</span>
			<h1>Super Admin Portal</h1>
			<p class="subtitle">Platform configuration and user role mapping workspace</p>
		</header>

		{#if message}
			<div class="status-banner" class:error-banner={isError} role="alert">
				<span class="status-icon">{isError ? '⚠️' : '✓'}</span>
				<span class="status-text">{message}</span>
			</div>
		{/if}

		<div class="admin-grid">
			<!-- Whitelist Panel -->
			<section class="glass-card whitelist-panel">
				<h2>Whitelist / Pre-Register User</h2>
				<p class="panel-desc">Add a Google email address or username to authorize access and assign a starting role.</p>

				<form
					method="POST"
					action="?/createUser"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							usernameInput = '';
							passwordInput = '';
							await update();
						};
					}}
					class="whitelist-form"
				>
					<div class="input-group">
						<label for="username">User Email or Username</label>
						<div class="input-wrapper">
							<span class="input-icon">👤</span>
							<input
								type="text"
								id="username"
								name="username"
								bind:value={usernameInput}
								placeholder="e.g. user@gmail.com"
								required
								disabled={loading}
							/>
						</div>
					</div>

					<div class="input-group">
						<label for="role">Assigned System Role</label>
						<div class="input-wrapper">
							<span class="input-icon">🔑</span>
							<select id="role" name="role" bind:value={roleInput} disabled={loading} class="role-select">
								{#each roles as r}
									<option value={r.id}>{r.name} - {r.desc}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="input-group">
						<label for="password">Password (Optional / Fallback Credentials)</label>
						<div class="input-wrapper">
							<span class="input-icon">🔒</span>
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								bind:value={passwordInput}
								placeholder="Temporary login password"
								disabled={loading}
							/>
							<button
								type="button"
								class="eye-btn"
								onclick={() => (showPassword = !showPassword)}
								disabled={loading}
							>
								{showPassword ? '👁️' : '🙈'}
							</button>
						</div>
						<p class="input-hint">Google users will sign in securely via OAuth. Password is a fallback for testing.</p>
					</div>

					<button type="submit" class="submit-btn" disabled={loading}>
						{#if loading}
							<span class="spinner"></span> Processing Whitelist...
						{:else}
							Whitelist Account ➔
						{/if}
					</button>
				</form>
			</section>

			<!-- Users Directory Panel -->
			<section class="glass-card directory-panel">
				<h2>Authorized Directory</h2>
				<p class="panel-desc">Active system access maps. Changing a role updates permissions instantly.</p>

				<div class="table-responsive">
					<table class="user-table">
						<thead>
							<tr>
								<th>Email / Username</th>
								<th>Access Level / Role Mapping</th>
								<th class="actions-header">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.users as user (user.id)}
								<tr class="user-row">
									<td class="username-cell">
										<span class="user-avatar">{user.username.slice(0, 2).toUpperCase()}</span>
										<span class="user-name">{user.username}</span>
									</td>
									<td>
										<form
											method="POST"
											action="?/updateRole"
											use:enhance={() => {
												loading = true;
												return async ({ update }) => {
													loading = false;
													await update();
												};
											}}
											class="role-update-form"
										>
											<input type="hidden" name="userId" value={user.id} />
											<select
												name="role"
												value={user.role}
												onchange={(e) => e.currentTarget.form?.requestSubmit()}
												disabled={loading}
												class="role-pill-select"
												style:--role-color={user.role === 'SuperAdmin'
													? '#ef4444'
													: user.role === 'Lead'
														? '#f59e0b'
														: user.role === 'Reviewer'
															? '#a855f7'
															: '#3b82f6'}
											>
												{#each roles as r}
													<option value={r.id}>{r.name}</option>
												{/each}
											</select>
										</form>
									</td>
									<td class="actions-cell">
										<form
											method="POST"
											action="?/deleteUser"
											use:enhance={() => {
												loading = true;
												return async ({ update }) => {
													loading = false;
													await update();
												};
											}}
											onsubmit={(e) => {
												if (!confirm(`Are you sure you want to revoke access and delete ${user.username}?`)) {
													e.preventDefault();
												}
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<button type="submit" class="revoke-btn" disabled={loading} title="Revoke system access">
												Revoke Access
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.admin-viewport {
		min-height: 100vh;
		width: 100%;
		position: relative;
		overflow-x: hidden;
		background: #060913;
		color: #f1f5f9;
		box-sizing: border-box;
		padding: 3rem 2rem;
	}

	/* Glowing Backdrops */
	.glow-bg-1 {
		position: absolute;
		top: 5%;
		left: 5%;
		width: 40vw;
		height: 40vw;
		background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.glow-bg-2 {
		position: absolute;
		bottom: 5%;
		right: 5%;
		width: 40vw;
		height: 40vw;
		background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.admin-wrapper {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Header */
	.admin-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.logo-badge {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(239, 68, 68, 0.25);
		font-weight: 700;
	}

	.admin-header h1 {
		margin: 0.5rem 0 0 0;
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, #ffffff 40%, #ef4444 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		font-size: 1.05rem;
		color: #94a3b8;
		margin: 0;
	}

	/* Status Banners */
	.status-banner {
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: 0.75rem;
		padding: 0.95rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		animation: slideIn 0.3s ease;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.15) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
	}

	.status-icon {
		font-size: 1.2rem;
	}

	.status-text {
		font-size: 0.95rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Grid Layout */
	.admin-grid {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 2rem;
	}

	@media (max-width: 1024px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Glassmorphism Cards */
	.glass-card {
		background: rgba(15, 23, 42, 0.45);
		backdrop-filter: blur(25px);
		-webkit-backdrop-filter: blur(25px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.5rem;
		padding: 2.25rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
	}

	.glass-card h2 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem 0;
		color: #ffffff;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.panel-desc {
		font-size: 0.9rem;
		color: #94a3b8;
		margin: 0 0 1.75rem 0;
		line-height: 1.5;
	}

	/* Forms */
	.whitelist-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #cbd5e1;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		font-size: 1.1rem;
		pointer-events: none;
		opacity: 0.7;
	}

	.input-wrapper input,
	.input-wrapper select {
		width: 100%;
		padding: 0.95rem 1rem 0.95rem 2.75rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.85rem;
		color: #ffffff;
		font-size: 0.95rem;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.input-wrapper select {
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
	}

	.input-wrapper select option {
		background: #0f172a;
		color: #ffffff;
	}

	.input-wrapper input:focus,
	.input-wrapper select:focus {
		outline: none;
		border-color: #ef4444;
		background: rgba(15, 23, 42, 0.8);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	.eye-btn {
		position: absolute;
		right: 0.75rem;
		background: transparent;
		border: none;
		box-shadow: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.5rem;
	}

	.eye-btn:hover {
		background: transparent;
	}

	.input-hint {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0.25rem 0 0 0;
	}

	.submit-btn {
		margin-top: 0.5rem;
		width: 100%;
		padding: 1.1rem;
		background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
		border: none;
		border-radius: 0.85rem;
		color: #ffffff;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3);
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 15px 25px -5px rgba(239, 68, 68, 0.45);
		filter: brightness(1.1);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* User Table */
	.table-responsive {
		width: 100%;
		overflow-x: auto;
	}

	.user-table {
		width: 100%;
		border-collapse: collapse;
		margin: 0;
	}

	.user-table th {
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 2px solid rgba(255, 255, 255, 0.08);
		color: #94a3b8;
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 1rem 1.25rem;
	}

	.actions-header {
		text-align: right !important;
	}

	.user-row {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		transition: background-color 0.2s ease;
	}

	.user-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.user-row td {
		padding: 1.2rem 1.25rem;
		vertical-align: middle;
	}

	.username-cell {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-avatar {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #ffffff;
		font-weight: 700;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: #ffffff;
		word-break: break-all;
	}

	/* Interactive Dropdowns */
	.role-pill-select {
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		color: #ffffff;
		font-size: 0.85rem;
		font-weight: 700;
		padding: 0.4rem 1.5rem 0.4rem 1rem;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		background-size: 1rem;
		box-shadow: inset 0 0 0 1px var(--role-color);
		transition: all 0.2s ease;
	}

	.role-pill-select:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
	}

	.role-pill-select option {
		background: #060913;
		color: #ffffff;
		font-weight: normal;
	}

	/* Revoke Button */
	.actions-cell {
		text-align: right;
	}

	.revoke-btn {
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.45rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: none;
	}

	.revoke-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
		color: #ffffff;
	}

	.revoke-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Spinner */
	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
