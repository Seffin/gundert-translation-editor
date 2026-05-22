<script lang="ts">
	import { BRAND_NAME } from '$lib/brand';
	import { goto } from '$app/navigation';

	let username = $state('');
	let password = $state('');
	let errorMsg = $state('');
	let loading = $state(false);

	const roles = [
		{
			id: 'translator',
			name: 'Translator',
			user: 'translator.demo',
			pass: 'translator123',
			icon: '✍️',
			desc: 'Translate OBS segments and consult GLM glossaries.',
			color: '#3b82f6'
		},
		{
			id: 'reviewer',
			name: 'Reviewer',
			user: 'reviewer.demo',
			pass: 'reviewer123',
			icon: '👀',
			desc: 'Approve segment drafts and comment on terminologies.',
			color: '#a855f7'
		},
		{
			id: 'lead',
			name: 'Project Lead',
			user: 'lead.demo',
			pass: 'lead123',
			icon: '👑',
			desc: 'Resolve blockages, compile targets, and publish OBS.',
			color: '#f59e0b'
		},
		{
			id: 'admin',
			name: 'Super Admin',
			user: 'admin.demo',
			pass: 'admin123',
			icon: '🛠️',
			desc: 'Universal bypass. Map users, modify roles, and oversee all flows.',
			color: '#ef4444'
		}
	];

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!username.trim() || !password.trim()) {
			errorMsg = 'Please enter both username and password';
			return;
		}

		loading = true;
		errorMsg = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (!res.ok) {
				errorMsg = data.error || 'Invalid credentials';
			} else {
				// Refresh page to trigger hooks redirect or manually route
				const role = data.user.role;
				if (role === 'SuperAdmin') {
					await goto('/admin');
				} else if (role === 'Lead') {
					await goto('/lead');
				} else if (role === 'Reviewer') {
					await goto('/reviewer');
				} else {
					await goto('/stories');
				}
				// Force a soft window refresh to update the Layout state completely
				window.location.reload();
			}
		} catch (err) {
			errorMsg = 'Failed to connect to authentication server';
		} finally {
			loading = false;
		}
	}

	function handleQuickLogin(user: string, pass: string) {
		username = user;
		password = pass;
		void handleSubmit();
	}
</script>

<div class="login-viewport">
	<div class="glow-bg-1"></div>
	<div class="glow-bg-2"></div>

	<div class="login-wrapper">
		<header class="login-header">
			<span class="logo-badge">Gundert Core</span>
			<h1>{BRAND_NAME}</h1>
			<p class="subtitle">Secure multi-role translation workflow environment</p>
		</header>

		<div class="login-grid">
			<!-- Form Panel -->
			<section class="glass-card login-form-panel">
				<h2>Sign In</h2>
				<p class="panel-desc">Enter your translation credentials below</p>

				{#if errorMsg}
					<div class="error-banner" role="alert">
						<span class="err-icon">⚠️</span>
						<span class="err-text">{errorMsg}</span>
					</div>
				{/if}

				<!-- Google Authentication Option -->
				<div class="google-auth-wrapper">
					<a href="/api/auth/google" class="google-login-btn">
						<svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
							<path fill="#EA4335" d="M12 5.04c1.67 0 3.19.57 4.38 1.69l3.27-3.27C17.68 1.54 15.01 0 12 0 7.35 0 3.37 2.67 1.48 6.57l3.96 3.07C6.39 6.84 8.97 5.04 12 5.04z"/>
							<path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58l3.76 2.91c2.2-2.03 3.49-5.02 3.49-8.65z"/>
							<path fill="#FBBC05" d="M5.44 14.5c-.24-.71-.38-1.47-.38-2.5s.14-1.79.38-2.5L1.48 6.43C.54 8.26 0 10.07 0 12s.54 3.74 1.48 5.57l3.96-3.07z"/>
							<path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.92l-3.76-2.91c-1.04.7-2.38 1.12-4.2 1.12-3.03 0-5.61-1.8-6.56-4.61l-3.96 3.07C3.37 21.33 7.35 24 12 24z"/>
						</svg>
						Sign in with Google
					</a>
					
					<div class="separator">
						<span class="separator-line"></span>
						<span class="separator-text">or fallback with credentials</span>
						<span class="separator-line"></span>
					</div>
				</div>

				<form onsubmit={handleSubmit} class="login-form">
					<div class="input-group">
						<label for="username">Username</label>
						<div class="input-wrapper">
							<span class="input-icon">👤</span>
							<input
								type="text"
								id="username"
								bind:value={username}
								placeholder="e.g. translator.demo"
								disabled={loading}
								autocomplete="username"
								required
							/>
						</div>
					</div>

					<div class="input-group">
						<label for="password">Password</label>
						<div class="input-wrapper">
							<span class="input-icon">🔒</span>
							<input
								type="password"
								id="password"
								bind:value={password}
								placeholder="••••••••••••"
								disabled={loading}
								autocomplete="current-password"
								required
							/>
						</div>
					</div>

					<button type="submit" class="submit-btn" disabled={loading}>
						{#if loading}
							<span class="spinner"></span> Authenticating...
						{:else}
							Access Workspace ➔
						{/if}
					</button>
				</form>

				<div class="pre-register-invite">
					<span>New to the team?</span>
					<a href="/pre-register" class="apply-link">Apply for Workspace Access →</a>
				</div>
			</section>

			<!-- Quick-Access Cards Panel -->
			<section class="glass-card quick-access-panel">
				<h2>Quick-Access Profiles</h2>
				<p class="panel-desc">Click a role profile card below for instant single-click login</p>

				<div class="quick-cards-list">
					{#each roles as role (role.id)}
						<button
							class="quick-card"
							style:--role-color={role.color}
							onclick={() => handleQuickLogin(role.user, role.pass)}
							disabled={loading}
							type="button"
						>
							<div class="quick-card-icon">{role.icon}</div>
							<div class="quick-card-info">
								<div class="quick-card-title">
									<h3>{role.name}</h3>
									<span class="quick-card-tag">{role.user}</span>
								</div>
								<p>{role.desc}</p>
							</div>
							<div class="quick-card-action">➔</div>
						</button>
					{/each}
				</div>
			</section>
		</div>

		<footer class="login-footer">
			<p>© 2026 Gundert Translation System. Dynamic Illustrated OBS scriptural pipelines.</p>
			<p><a href="/demo">Go to Public illustrated Demo Showcase Reader</a></p>
		</footer>
	</div>
</div>

<style>
	.login-viewport {
		min-height: 100vh;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1.5rem;
		position: relative;
		overflow-x: hidden;
		background: #060913;
		color: #f1f5f9;
		box-sizing: border-box;
	}

	/* Glowing Backdrops */
	.glow-bg-1 {
		position: absolute;
		top: 15%;
		left: 10%;
		width: 45vw;
		height: 45vw;
		background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.glow-bg-2 {
		position: absolute;
		bottom: 15%;
		right: 10%;
		width: 45vw;
		height: 45vw;
		background: radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.login-wrapper {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	/* Header */
	.login-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-badge {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(56, 189, 248, 0.25);
		font-weight: 700;
	}

	.login-header h1 {
		margin: 0.5rem 0 0 0;
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, #ffffff 40%, #a855f7 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		font-size: 1.05rem;
		color: #94a3b8;
		margin: 0;
	}

	/* Grid Layout */
	.login-grid {
		display: grid;
		grid-template-columns: 1.1fr 1.2fr;
		gap: 2rem;
	}

	@media (max-width: 900px) {
		.login-grid {
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
	}

	/* Form Styling */
	.login-form {
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

	.input-wrapper input {
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

	.input-wrapper input:focus {
		outline: none;
		border-color: #38bdf8;
		background: rgba(15, 23, 42, 0.8);
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
	}

	.input-wrapper input::placeholder {
		color: #475569;
	}

	.submit-btn {
		margin-top: 0.5rem;
		width: 100%;
		padding: 1.1rem;
		background: linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%);
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
		box-shadow: 0 10px 20px -5px rgba(56, 189, 248, 0.3);
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 15px 25px -5px rgba(56, 189, 248, 0.45);
		filter: brightness(1.1);
	}

	.submit-btn:active {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Error Banner */
	.error-banner {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.75rem;
		padding: 0.85rem 1.1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.err-icon {
		font-size: 1.2rem;
	}

	.err-text {
		font-size: 0.875rem;
		color: #fca5a5;
		font-weight: 600;
	}

	/* Spinner */
	.spinner {
		width: 1.1rem;
		height: 1.1rem;
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

	/* Quick-Access Cards */
	.quick-cards-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quick-card {
		background: rgba(30, 41, 59, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 1rem;
		padding: 1.1rem 1.4rem;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		color: inherit;
		font-family: inherit;
	}

	.quick-card-icon {
		font-size: 2rem;
		background: rgba(255, 255, 255, 0.03);
		width: 3.5rem;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: all 0.25s ease;
	}

	.quick-card-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.quick-card-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.quick-card-title h3 {
		font-size: 1.1rem;
		margin: 0;
		color: #ffffff;
		font-weight: 700;
	}

	.quick-card-tag {
		font-size: 0.7rem;
		font-family: var(--font-mono, monospace);
		background: rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.quick-card-info p {
		font-size: 0.825rem;
		color: #94a3b8;
		margin: 0;
		line-height: 1.4;
	}

	.quick-card-action {
		font-size: 1.2rem;
		opacity: 0;
		transform: translateX(-10px);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--role-color);
	}

	/* Card Hovers */
	.quick-card:hover {
		background: rgba(30, 41, 59, 0.65);
		border-color: var(--role-color);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px -3px var(--role-color);
		transform: translateY(-2px);
	}

	.quick-card:hover .quick-card-icon {
		background: rgba(255, 255, 255, 0.07);
		border-color: var(--role-color);
		transform: scale(1.05);
	}

	.quick-card:hover .quick-card-action {
		opacity: 1;
		transform: translateX(0);
	}

	.quick-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Footer */
	.login-footer {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.login-footer p {
		font-size: 0.8rem;
		color: #475569;
		margin: 0;
	}

	.login-footer a {
		color: #38bdf8;
		font-weight: 600;
	}

	.login-footer a:hover {
		color: #a855f7;
	}

	/* Google Sign-in styles */
	.google-auth-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.google-login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.95rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.85rem;
		color: #ffffff;
		font-size: 0.95rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 0.25s ease;
		cursor: pointer;
	}

	.google-login-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(56, 189, 248, 0.4);
		box-shadow: 0 4px 15px -3px rgba(56, 189, 248, 0.15);
		transform: translateY(-1px);
	}

	.google-icon {
		flex-shrink: 0;
	}

	.separator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #475569;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.separator-line {
		flex: 1;
		height: 1px;
		background: rgba(255, 255, 255, 0.06);
	}

	.separator-text {
		white-space: nowrap;
	}

	.pre-register-invite {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.apply-link {
		color: #38bdf8;
		font-weight: 700;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.apply-link:hover {
		color: #a855f7;
		transform: translateX(2px);
	}
</style>
