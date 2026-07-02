<script lang="ts">
	import { onMount } from 'svelte';
	import {
		addGlossaryTerm,
		createGlossaryTermDraft,
		updateGlossaryTerm,
		type GlossaryTerm,
		type GlossaryTermDraft
	} from '$lib/glossary';
	import { SUPPORTED_LANGUAGES } from '$lib/client/target-language';

	let { initialTerms, defaultLanguage = 'Malayalam' } = $props<{
		initialTerms: GlossaryTerm[];
		defaultLanguage?: string;
	}>();

	let terms = $state<GlossaryTerm[]>([]);
	let draft = $state<GlossaryTermDraft>(createGlossaryTermDraft('Malayalam'));
	let editingId = $state<string | null>(null);
	let message = $state('');

	onMount(() => {
		terms = initialTerms.map((term: GlossaryTerm) => ({ ...term }));
		draft.language = defaultLanguage;
	});

	function resetForm(): void {
		draft = createGlossaryTermDraft(defaultLanguage);
		editingId = null;
	}

	function submitForm(): void {
		if (editingId) {
			terms = updateGlossaryTerm(terms, editingId, draft);
			message = `Updated ${draft.sourceTerm}.`;
			resetForm();
			return;
		}

		terms = addGlossaryTerm(terms, draft);
		message = `Added ${draft.sourceTerm}.`;
		resetForm();
	}

	function startEdit(term: GlossaryTerm): void {
		editingId = term.id;
		draft = {
			sourceTerm: term.sourceTerm,
			targetTerm: term.targetTerm,
			status: term.status,
			rationale: term.rationale,
			language: term.language
		};
		message = `Editing ${term.sourceTerm}.`;
	}
</script>

<section aria-label="glossary-management">
	<h1>Glossary Management</h1>
	<p>Manage approved and proposed translation terms for consistency checks.</p>

	{#if message}
		<p data-testid="glossary-message" class="message">{message}</p>
	{/if}

	<form
		onsubmit={(event) => {
			event.preventDefault();
			submitForm();
		}}
	>
		<div class="fields">
			<label>
				Source term
				<input bind:value={draft.sourceTerm} required />
			</label>
			<label>
				Target term
				<input bind:value={draft.targetTerm} required />
			</label>
			<label>
				Language
				<select bind:value={draft.language} required>
					{#each SUPPORTED_LANGUAGES as lang}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
			</label>
			<label>
				Status
				<select bind:value={draft.status}>
					<option value="Proposed">Proposed</option>
					<option value="Approved">Approved</option>
				</select>
			</label>
			<label style="grid-column: span 2;">
				Rationale
				<input bind:value={draft.rationale} style="width: 100%;" />
			</label>
		</div>

		<button type="submit">{editingId ? 'Save Changes' : 'Add Term'}</button>
	</form>

	<div class="table-responsive">
		<table>
			<thead>
				<tr>
					<th>Term (EN)</th>
					<th>Translation</th>
					<th>Language</th>
					<th>Status</th>
					<th>Rationale</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#each terms as term (term.id)}
					<tr>
						<td>{term.sourceTerm}</td>
						<td>{term.targetTerm}</td>
						<td>{term.language}</td>
						<td>{term.status}</td>
						<td>{term.rationale}</td>
						<td>
							<button type="button" onclick={() => startEdit(term)} aria-label={`Edit ${term.id}`}
								>Edit</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	section {
		padding: 2rem;
		max-width: 1280px;
		margin: 0 auto;
		background: var(--color-panel-strong);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.25rem;
		box-shadow: var(--shadow-subtle);
	}

	h1 {
		margin: 0 0 0.5rem;
	}

	p {
		margin: 0;
		color: var(--color-on-surface-variant);
	}

	form {
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	.fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	@media (max-width: 700px) {
		.fields {
			grid-template-columns: 1fr;
		}
		section {
			padding: 1rem;
			background: transparent;
			border: none;
			box-shadow: none;
			border-radius: 0;
		}
		button {
			width: 100%;
		}
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-weight: 600;
		color: var(--color-on-background);
	}

	input,
	select {
		padding: 0.45rem 0.5rem;
		border: 1px solid var(--color-outline-variant);
		background-color: var(--color-surface-container-lowest);
		color: var(--color-on-background);
		border-radius: var(--radius-sm);
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-accent-soft);
	}

	button {
		padding: 0.45rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button:hover {
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
		transform: translateY(-1px);
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	th,
	td {
		border-bottom: 1px solid var(--color-outline-variant);
		text-align: left;
		padding: 1rem 1.1rem;
	}

	th {
		background: var(--color-surface-container-high);
		color: var(--color-on-surface-variant);
		font-weight: 700;
	}

	tbody tr {
		background: var(--color-panel-strong);
		transition: background-color 0.2s ease;
	}

	tbody tr:hover {
		background: var(--color-surface-container-low);
	}

	.message {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
		color: var(--color-success);
	}
</style>
