<script lang="ts">
	import { BRAND_NAME } from '$lib/brand';
	import { goto } from '$app/navigation';

	let customEmail = $state('');
	let customName = $state('');
	let errorMsg = $state('');
	let loading = $state(false);

	const demoAccounts = [
		{ email: 'admin.demo@gmail.com', name: 'Albin Gundert (SuperAdmin)', icon: '🛠️' },
		{ email: 'translator.demo@gmail.com', name: 'Balan Nair (Translator)', icon: '✍️' },
		{ email: 'reviewer.demo@gmail.com', name: 'Chacko Joseph (Reviewer)', icon: '👀' },
		{ email: 'lead.demo@gmail.com', name: 'Diana Kuruvilla (Project Lead)', icon: '👑' }
	];

	async function selectAccount(email: string, name: string) {
		loading = true;
		errorMsg = '';
		
		// Simulate latency
		await new Promise(r => setTimeout(r, 600));

		const redirectUrl = `/api/auth/google/callback?code=mock_code_123&state=secure_random_state_string_123&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
		await goto(redirectUrl);
	}

	function handleCustomSubmit(e: Event) {
		e.preventDefault();
		if (!customEmail.trim()) {
			errorMsg = 'Please enter an email address';
			return;
		}
		if (!customEmail.includes('@')) {
			errorMsg = 'Please enter a valid email address';
			return;
		}

		const name = customName.trim() || customEmail.split('@')[0].replace(/\./g, ' ');
		void selectAccount(customEmail.trim(), name);
	}
</script>

<div class="simulator-viewport">
	<div class="glow-bg-google"></div>

	<div class="simulator-card glass-card">
		<div class="google-header">
			<svg class="google-logo" viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
				<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
				<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
				<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
				<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
			</svg>
			<h1>Sign in with Google</h1>
			<p class="subtitle">Mock Google Consent Account Chooser (Developer Sandbox)</p>
		</div>

		{#if errorMsg}
			<div class="error-banner">
				<span class="err-icon">⚠️</span>
				<span class="err-text">{errorMsg}</span>
			</div>
		{/if}

		<div class="accounts-section">
			<h2>Choose an account</h2>
			<p class="section-desc">to continue to <strong>{BRAND_NAME}</strong></p>

			<div class="accounts-list">
				{#each demoAccounts as acc}
					<button 
						type="button" 
						class="account-row" 
						onclick={() => selectAccount(acc.email, acc.name)}
						disabled={loading}
					>
						<span class="account-avatar">{acc.icon}</span>
						<div class="account-meta">
							<span class="account-name">{acc.name}</span>
							<span class="account-email">{acc.email}</span>
						</div>
						<span class="account-arrow">➔</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="divider">
			<span>or use a custom email</span>
		</div>

		<form onsubmit={handleCustomSubmit} class="custom-form">
			<div class="input-group">
				<label for="custom-email">Email Address</label>
				<input 
					type="email" 
					id="custom-email" 
					bind:value={customEmail} 
					placeholder="scholar.heidelberg@gmail.com" 
					disabled={loading}
					required
				/>
			</div>

			<div class="input-group">
				<label for="custom-name">Full Name (Optional)</label>
				<input 
					type="text" 
					id="custom-name" 
					bind:value={customName} 
					placeholder="Johannes Gundert" 
					disabled={loading}
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{#if loading}
					<span class="spinner"></span> Simulating Sign-in...
				{:else}
					Simulate Google Sign-in ➔
				{/if}
			</button>
		</form>

		<footer class="simulator-footer">
			<p>This sandbox simulates the Google OAuth 2.0 loop without active API keys.</p>
		</footer>
	</div>
</div>

<style>
	.simulator-viewport {
		min-height: 100vh;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1.5rem;
		background: #060810;
		color: #e2e8f0;
		position: relative;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	.glow-bg-google {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 70vw;
		height: 70vw;
		background: radial-gradient(circle, rgba(66, 133, 244, 0.12) 0%, transparent 60%);
		pointer-events: none;
		z-index: 1;
	}

	.simulator-card {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 520px;
		background: rgba(15, 23, 42, 0.55);
		backdrop-filter: blur(30px);
		-webkit-backdrop-filter: blur(30px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.5rem;
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
		box-sizing: border-box;
	}

	.google-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.google-logo {
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
	}

	.google-header h1 {
		font-size: 1.75rem;
		margin: 0;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.85rem;
		color: #94a3b8;
		margin: 0;
	}

	.accounts-section {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		margin-bottom: 1.5rem;
	}

	.accounts-section h2 {
		font-size: 1.1rem;
		margin: 0;
		color: #ffffff;
	}

	.section-desc {
		font-size: 0.85rem;
		color: #64748b;
		margin: 0 0 1rem 0;
	}

	.accounts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.account-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 0.85rem 1.25rem;
		background: rgba(30, 41, 59, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 1rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		color: inherit;
	}

	.account-row:hover {
		background: rgba(30, 41, 59, 0.7);
		border-color: rgba(66, 133, 244, 0.4);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(66, 133, 244, 0.15);
	}

	.account-row:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.account-avatar {
		font-size: 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.account-meta {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.account-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffffff;
	}

	.account-email {
		font-size: 0.8rem;
		color: #94a3b8;
	}

	.account-arrow {
		font-size: 1rem;
		color: #4285f4;
		opacity: 0;
		transform: translateX(-10px);
		transition: all 0.2s ease;
	}

	.account-row:hover .account-arrow {
		opacity: 1;
		transform: translateX(0);
	}

	.divider {
		position: relative;
		text-align: center;
		margin: 1.75rem 0;
	}

	.divider::before {
		content: "";
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		z-index: 1;
	}

	.divider span {
		position: relative;
		z-index: 2;
		background: #0f172a;
		padding: 0 1rem;
		font-size: 0.8rem;
		color: #64748b;
		border-radius: 99px;
	}

	.custom-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.input-group label {
		font-size: 0.8rem;
		color: #94a3b8;
		font-weight: 600;
	}

	.input-group input {
		width: 100%;
		padding: 0.85rem 1rem;
		background: rgba(15, 23, 42, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		color: #ffffff;
		font-size: 0.9rem;
		font-family: inherit;
		box-sizing: border-box;
		transition: all 0.2s ease;
	}

	.input-group input:focus {
		outline: none;
		border-color: #4285f4;
		box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
		border: none;
		border-radius: 0.75rem;
		color: #ffffff;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(66, 133, 244, 0.2);
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(66, 133, 244, 0.35);
		filter: brightness(1.05);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.err-icon {
		font-size: 1.1rem;
	}

	.err-text {
		font-size: 0.85rem;
		color: #fca5a5;
		font-weight: 500;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.simulator-footer {
		text-align: center;
		margin-top: 2rem;
	}

	.simulator-footer p {
		font-size: 0.75rem;
		color: #475569;
		margin: 0;
	}
</style>
