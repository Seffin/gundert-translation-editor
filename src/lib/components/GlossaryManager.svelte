<script lang="ts">
	import { onMount } from 'svelte';
	import {
		addGlossaryTerm,
		createGlossaryTermDraft,
		updateGlossaryTerm,
		type GlossaryTerm,
		type GlossaryTermDraft
	} from '$lib/glossary';

	let { initialTerms } = $props<{ initialTerms: GlossaryTerm[] }>();

	let terms = $state<GlossaryTerm[]>([]);
	let draft = $state<GlossaryTermDraft>(createGlossaryTermDraft());
	let editingId = $state<string | null>(null);
	let message = $state('');

	onMount(() => {
		terms = initialTerms.map((term) => ({ ...term }));
	});

	function resetForm(): void {
		draft = createGlossaryTermDraft();
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
			rationale: term.rationale
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
				Status
				<select bind:value={draft.status}>
					<option value="Proposed">Proposed</option>
					<option value="Approved">Approved</option>
				</select>
			</label>
			<label>
				Rationale
				<input bind:value={draft.rationale} />
			</label>
		</div>

		<button type="submit">{editingId ? 'Save Changes' : 'Add Term'}</button>
	</form>

	<table>
		<thead>
			<tr>
				<th>Term (EN)</th>
				<th>Translation</th>
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
					<td>{term.status}</td>
					<td>{term.rationale}</td>
					<td>
						<button type="button" onclick={() => startEdit(term)} aria-label={`Edit ${term.id}`}>Edit</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	section {
		padding: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
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

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-weight: 600;
	}

	input,
	select {
		padding: 0.45rem 0.5rem;
		border: 1px solid #c7c5d1;
	}

	button {
		padding: 0.45rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #2d336b;
		background: #dfe0ff;
		color: #161c54;
		font-weight: 700;
		cursor: pointer;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		border-bottom: 1px solid #ddd;
		text-align: left;
		padding: 0.625rem;
	}

	.message {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
		color: #1f4f3f;
	}
</style>
