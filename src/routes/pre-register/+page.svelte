<script lang="ts">
	import { BRAND_NAME } from '$lib/brand';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let email = $state(data.email || '');
	let name = $state(data.name || '');
	let selectedRole = $state('Translator');
	let justification = $state('');
	let loading = $state(false);

	const roles = [
		{ id: 'Translator', name: 'Translator', desc: 'Draft translation segments and manage local term consistency.' },
		{ id: 'Reviewer', name: 'Reviewer', desc: 'Provide quality review, resolve terminology warnings, and comment.' },
		{ id: 'Lead', name: 'Project Lead', desc: 'Supervise translation stages, approve final stories, and manage team members.' }
	];
</script>

<div class="pre-reg-viewport">
	<div class="glow-bg-1"></div>
	<div class="glow-bg-2"></div>

	<div class="pre-reg-wrapper">
		<header class="pre-reg-header">
			<span class="badge">Registration Portal</span>
			<h1>Apply for Workspace Access</h1>
			<p class="subtitle">Secure multi-role OBS translation and peer review desk</p>
		</header>

		<div class="glass-card main-card">
			<!-- Status Banners -->
			{#if data.status === 'Pending'}
				<div class="status-banner pending">
					<span class="status-icon">⏳</span>
					<div class="status-content">
						<h3>Application Under Review</h3>
						<p>Your request for <strong>{email}</strong> is currently pending Super Admin approval. Once approved, you will be able to log in with Google instantly.</p>
					</div>
				</div>
			{:else}
				{#if data.status === 'Rejected'}
					<div class="status-banner rejected">
						<span class="status-icon">❌</span>
						<div class="status-content">
							<h3>Access Application Rejected</h3>
							<p>The access request for <strong>{email}</strong> was rejected by the administration. Please contact the project administrator directly if you believe this is an error.</p>
						</div>
					</div>
				{/if}

				{#if form?.success}
					<div class="status-banner success">
						<span class="status-icon">🎉</span>
						<div class="status-content">
							<h3>Request Successfully Filed</h3>
							<p>{form.message}</p>
						</div>
					</div>
				{:else}
					{#if form?.error}
						<div class="status-banner error" role="alert">
							<span class="status-icon">⚠️</span>
							<span class="status-text">{form.error}</span>
						</div>
					{/if}

					<form 
						method="POST" 
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}} 
						class="reg-form"
					>
						<!-- User profile pre-fills -->
						<div class="form-grid">
							<div class="input-group">
								<label for="reg-name">Full Name</label>
								<div class="input-wrapper">
									<span class="field-icon">👤</span>
									<input 
										type="text" 
										id="reg-name" 
										name="name" 
										bind:value={name} 
										placeholder="e.g. Balan Nair" 
										disabled={loading}
										required
									/>
								</div>
							</div>

							<div class="input-group">
								<label for="reg-email">Google Email Address</label>
								<div class="input-wrapper">
									<span class="field-icon">📧</span>
									<!-- Email is readonly if they come prefilled from Google flow for safety -->
									<input 
										type="email" 
										id="reg-email" 
										name="email" 
										bind:value={email} 
										placeholder="e.g. balan.nair@gmail.com" 
										readonly={!!data.email}
										disabled={loading}
										required
									/>
								</div>
								{#if data.email}
									<span class="input-help">Verified Google email address. Locked for security.</span>
								{/if}
							</div>
						</div>

						<!-- Role Selection -->
						<div class="role-selection">
							<label class="block-label">Select Workspace Role</label>
							<p class="role-desc">Select the workspace access clearance you require. This is subject to lead verification.</p>
							
							<div class="role-cards-grid">
								{#each roles as role}
									<button 
										type="button" 
										class="role-card" 
										class:selected={selectedRole === role.id}
										onclick={() => selectedRole = role.id}
										disabled={loading}
									>
										<input 
											type="radio" 
											name="role" 
											value={role.id} 
											checked={selectedRole === role.id}
											style="display:none;" 
										/>
										<div class="role-radio-indicator"></div>
										<div class="role-info">
											<h4>{role.name}</h4>
											<p>{role.desc}</p>
										</div>
									</button>
								{/each}
							</div>
						</div>

						<!-- Justification -->
						<div class="input-group">
							<label for="reg-justification">Workspace Justification / Experience</label>
							<p class="input-help-above">Briefly explain your role in this translation project or details for the Lead to confirm your access.</p>
							<textarea 
								id="reg-justification" 
								name="justification" 
								bind:value={justification}
								placeholder="Describe your qualifications, organization, or translating context..." 
								rows="4"
								disabled={loading}
							></textarea>
						</div>

						<button type="submit" class="submit-btn" disabled={loading}>
							{#if loading}
								<span class="spinner"></span> Filing Application...
							{:else}
								Submit Access Request ➔
							{/if}
						</button>
					</form>
				{/if}
			{/if}

			<div class="actions-footer">
				<a href="/login" class="back-link">← Return to Login page</a>
			</div>
		</div>

		<footer class="pre-reg-footer">
			<p>© 2026 {BRAND_NAME}. Protected under multi-tiered authorization protocols.</p>
		</footer>
	</div>
</div>

<style>
	.pre-reg-viewport {
		min-height: 100vh;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 3rem 1.5rem;
		background: #060913;
		color: #e2e8f0;
		position: relative;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	.glow-bg-1 {
		position: absolute;
		top: 10%;
		left: 10%;
		width: 50vw;
		height: 50vw;
		background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.glow-bg-2 {
		position: absolute;
		bottom: 10%;
		right: 10%;
		width: 50vw;
		height: 50vw;
		background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
		pointer-events: none;
		z-index: 1;
	}

	.pre-reg-wrapper {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 780px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.pre-reg-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		background: rgba(168, 85, 247, 0.15);
		color: #c084fc;
		padding: 0.35rem 1rem;
		border-radius: 999px;
		border: 1px solid rgba(168, 85, 247, 0.25);
		font-weight: 700;
	}

	.pre-reg-header h1 {
		margin: 0.5rem 0 0 0;
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, #ffffff 40%, #c084fc 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		font-size: 1rem;
		color: #94a3b8;
		margin: 0;
	}

	.glass-card {
		background: rgba(15, 23, 42, 0.5);
		backdrop-filter: blur(25px);
		-webkit-backdrop-filter: blur(25px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.5rem;
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		box-sizing: border-box;
	}

	.status-banner {
		display: flex;
		gap: 1.25rem;
		padding: 1.5rem;
		border-radius: 1rem;
		margin-bottom: 2rem;
		box-sizing: border-box;
	}

	.status-banner.pending {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.25);
	}

	.status-banner.pending .status-icon {
		font-size: 2rem;
	}

	.status-banner.pending h3 {
		color: #f59e0b;
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
	}

	.status-banner.pending p {
		font-size: 0.9rem;
		color: #cbd5e1;
		margin: 0;
		line-height: 1.5;
	}

	.status-banner.rejected {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
	}

	.status-banner.rejected .status-icon {
		font-size: 2rem;
	}

	.status-banner.rejected h3 {
		color: #ef4444;
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
	}

	.status-banner.rejected p {
		font-size: 0.9rem;
		color: #cbd5e1;
		margin: 0;
		line-height: 1.5;
	}

	.status-banner.success {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.status-banner.success .status-icon {
		font-size: 2rem;
	}

	.status-banner.success h3 {
		color: #22c55e;
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
	}

	.status-banner.success p {
		font-size: 0.9rem;
		color: #cbd5e1;
		margin: 0;
		line-height: 1.5;
	}

	.status-banner.error {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: #fca5a5;
		font-size: 0.9rem;
		font-weight: 600;
		display: flex;
		align-items: center;
	}

	.reg-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
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

	.block-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: #cbd5e1;
		margin-bottom: 0.25rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-icon {
		position: absolute;
		left: 1rem;
		font-size: 1.1rem;
		opacity: 0.6;
		pointer-events: none;
	}

	.input-wrapper input {
		width: 100%;
		padding: 0.9rem 1rem 0.9rem 2.75rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.75rem;
		color: #ffffff;
		font-size: 0.95rem;
		font-family: inherit;
		box-sizing: border-box;
		transition: all 0.2s ease;
	}

	.input-wrapper input:focus, .input-group textarea:focus {
		outline: none;
		border-color: #a855f7;
		background: rgba(15, 23, 42, 0.8);
		box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
	}

	.input-wrapper input:read-only {
		background: rgba(30, 41, 59, 0.25);
		border-color: rgba(255, 255, 255, 0.05);
		color: #94a3b8;
		cursor: not-allowed;
	}

	.input-help {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.input-help-above {
		font-size: 0.78rem;
		color: #94a3b8;
		margin: 0 0 0.25rem 0;
	}

	.input-group textarea {
		width: 100%;
		padding: 1rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.75rem;
		color: #ffffff;
		font-size: 0.95rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
		transition: all 0.2s ease;
	}

	.role-selection {
		display: flex;
		flex-direction: column;
	}

	.role-desc {
		font-size: 0.8rem;
		color: #64748b;
		margin: 0 0 1.25rem 0;
	}

	.role-cards-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.role-cards-grid {
			grid-template-columns: 1fr;
		}
	}

	.role-card {
		background: rgba(30, 41, 59, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 1rem;
		padding: 1.25rem;
		cursor: pointer;
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		text-align: left;
		color: inherit;
		font-family: inherit;
		transition: all 0.25s ease;
	}

	.role-radio-indicator {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.2);
		margin-top: 0.15rem;
		position: relative;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	.role-radio-indicator::after {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		width: 0.5rem;
		height: 0.5rem;
		background: #c084fc;
		border-radius: 50%;
		transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.role-card.selected {
		background: rgba(168, 85, 247, 0.1);
		border-color: rgba(168, 85, 247, 0.4);
		box-shadow: 0 8px 25px rgba(168, 85, 247, 0.1);
	}

	.role-card.selected .role-radio-indicator {
		border-color: #c084fc;
	}

	.role-card.selected .role-radio-indicator::after {
		transform: translate(-50%, -50%) scale(1);
	}

	.role-card:hover:not(.selected) {
		background: rgba(30, 41, 59, 0.55);
		border-color: rgba(255, 255, 255, 0.12);
	}

	.role-info h4 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #ffffff;
		font-weight: 700;
	}

	.role-info p {
		margin: 0;
		font-size: 0.78rem;
		color: #94a3b8;
		line-height: 1.4;
	}

	.submit-btn {
		width: 100%;
		padding: 1.1rem;
		background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
		border: none;
		border-radius: 0.85rem;
		color: #ffffff;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.25s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.3);
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 15px 25px -5px rgba(168, 85, 247, 0.45);
		filter: brightness(1.1);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 1.1rem;
		height: 1.1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.actions-footer {
		margin-top: 2rem;
		text-align: center;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 1.5rem;
	}

	.back-link {
		color: #94a3b8;
		font-size: 0.9rem;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: #c084fc;
	}

	.pre-reg-footer {
		text-align: center;
	}

	.pre-reg-footer p {
		font-size: 0.8rem;
		color: #475569;
		margin: 0;
	}
</style>
