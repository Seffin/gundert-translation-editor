<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import {
		applyPersistedStoryDraft,
		buildPersistedStoryDraft,
		hasUnsavedChanges,
		loadPersistedStoryDraft,
		savePersistedStoryDraft,
		type PersistedStoryDraft
	} from '$lib/client/story-editor-draft';
	import { confirmDiscardChanges } from '$lib/client/route-leave-guard';
	import {
		buildSegmentSelectionModel,
		toggleSegmentSelection,
		requestGeminiChunkDraft,
		type SegmentSelectionModel
	} from '$lib/client/gemini-chunk';
	import { loadTargetLanguage, saveTargetLanguage } from '$lib/client/target-language';
	import { buildTerminologyWarnings } from '$lib/client/terminology-warnings';
	import {
		buildConsistencyIssues,
		validateConsistencyIssuesWithLLM,
		type ConsistencyIssue
	} from '$lib/client/consistency-check';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import type { GlossaryTerm } from '$lib/glossary';
	import type { EditorSegment, StoryEditorModel } from '$lib/server/editor';
	import type { ReviewerComment } from '$lib/server/reviewer-comments';

	const ACTOR_ID = 'translator.demo';
	const STORY_COMMENTS_KEY = '__story__';

	type TerminologyWarningItem = {
		segmentId: string;
		sourceTerm: string;
		expectedTargetTerm: string;
	};

	function groupTerminologyWarningsBySegment(
		warnings: TerminologyWarningItem[]
	): Record<string, TerminologyWarningItem[]> {
		return warnings.reduce<Record<string, TerminologyWarningItem[]>>((groups, warning) => {
			groups[warning.segmentId] = [...(groups[warning.segmentId] ?? []), warning];
			return groups;
		}, {});
	}

	function groupReviewerCommentsBySegment(
		comments: ReviewerComment[]
	): Record<string, ReviewerComment[]> {
		return comments.reduce<Record<string, ReviewerComment[]>>((groups, comment) => {
			const key = comment.segmentId ?? STORY_COMMENTS_KEY;
			groups[key] = [...(groups[key] ?? []), comment];
			return groups;
		}, {});
	}

	let {
		story,
		glossaryTerms = [],
		apiKey = null
	} = $props<{ story: StoryEditorModel; glossaryTerms?: GlossaryTerm[]; apiKey?: string | null }>();

	function createInitialSegments() {
		return story.segments.map((segment) => ({ ...segment }));
	}

	function createCommentExpansionState(segments: EditorSegment[]): Record<string, boolean> {
		const expansionState: Record<string, boolean> = {};
		for (const segment of segments) {
			expansionState[segment.id] = false;
		}
		return expansionState;
	}

	const initialSegments = createInitialSegments();

	let editorSegments = $state(initialSegments);
	let isDirty = $state(false);
	let saveMessage = $state('');
	let saving = $state(false);
	let lastSavedDraft = $state<PersistedStoryDraft | undefined>(undefined);
	let selection = $state<SegmentSelectionModel>(buildSegmentSelectionModel(initialSegments));
	let activeSegmentId = $state<string | null>(initialSegments[0]?.id ?? null);
	let drafting = $state(false);
	let draftingSegmentIds = $state<string[]>([]);
	let draftError = $state('');
	let selectedLanguage = $state((() => story.targetLanguage)());
	let reviewerComments = $state<ReviewerComment[]>([]);
	let commentsLoading = $state(false);
	let commentError = $state<string | null>(null);
	let commentMutationSegmentId = $state<string | null>(null);
	let expandedCommentSegments = $state<Record<string, boolean>>(
		createCommentExpansionState(initialSegments)
	);
	let commentDrafts = $state<Record<string, string>>({});
	let terminologyWarnings = $derived(buildTerminologyWarnings(editorSegments, glossaryTerms));
	let terminologyWarningsBySegment = $derived(
		groupTerminologyWarningsBySegment(terminologyWarnings)
	);
	let consistencyIssues = $derived(buildConsistencyIssues(editorSegments, glossaryTerms));
	let llmValidating = $state(false);
	let validatedConsistencyIssues = $state<Array<ConsistencyIssue & { validated?: boolean }>>([]);
	let reviewerCommentsBySegment = $derived(groupReviewerCommentsBySegment(reviewerComments));
	let storyLevelComments = $derived(reviewerCommentsBySegment[STORY_COMMENTS_KEY] ?? []);
	let unresolvedCommentCount = $derived(
		reviewerComments.filter((comment) => !comment.resolved).length
	);
	let consistencyIssueCount = $derived(
		validatedConsistencyIssues.filter((issue) => issue.validated !== false).length
	);

	$effect(async () => {
		if (consistencyIssues.length > 0 && apiKey) {
			llmValidating = true;
			const validated = await validateConsistencyIssuesWithLLM(
				consistencyIssues,
				selectedLanguage,
				apiKey
			);
			validatedConsistencyIssues = validated;
			llmValidating = false;
		} else {
			validatedConsistencyIssues = consistencyIssues;
		}
	});

	async function fetchReviewerComments(): Promise<void> {
		commentsLoading = true;
		commentError = null;

		try {
			const response = await fetch(`/api/reviewer-comments?storyId=${story.storyId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch reviewer comments');
			}

			const data = (await response.json()) as { comments?: ReviewerComment[] };
			reviewerComments = data.comments ?? [];
		} catch (err) {
			commentError = err instanceof Error ? err.message : 'Failed to fetch reviewer comments';
		} finally {
			commentsLoading = false;
		}
	}

	onMount(() => {
		selectedLanguage = loadTargetLanguage(story.storyId);
		editorSegments = editorSegments.map((segment) => ({
			...segment,
			targetLanguage: selectedLanguage
		}));

		const persisted = loadPersistedStoryDraft(story.storyId);
		if (persisted) {
			editorSegments = applyPersistedStoryDraft(editorSegments, persisted);
			lastSavedDraft = persisted;
			saveMessage = `Saved by ${persisted.savedByActorId} at ${persisted.savedAtIso}`;
			isDirty = false;
		}

		void fetchReviewerComments();

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty && hasUnsavedChanges(editorSegments, lastSavedDraft)) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	beforeNavigate(async (navigation) => {
		if (!isDirty || !hasUnsavedChanges(editorSegments, lastSavedDraft)) {
			return;
		}

		const allowed = await confirmDiscardChanges(editorSegments, lastSavedDraft);
		if (!allowed) {
			navigation.cancel();
		}
	});

	function markDirty(): void {
		isDirty = hasUnsavedChanges(editorSegments, lastSavedDraft);
		if (isDirty) saveMessage = '';
	}

	function formatTimestamp(isoValue?: string): string {
		if (!isoValue) return 'Not yet edited';

		const date = new Date(isoValue);
		if (Number.isNaN(date.valueOf())) return isoValue;

		return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
	}

	function getSegmentStatusLabel(segment: EditorSegment): string {
		if (segment.status === 'Done') return 'Reviewed';
		if (segment.lastSavedByActorId || segment.targetText.trim().length > 0) return 'Drafted';
		if (segment.draftedByGemini) return 'Generated';
		return 'Draft';
	}

	function getLastEditedBy(segment: EditorSegment): string {
		if (segment.lastSavedByActorId) return segment.lastSavedByActorId;
		if (segment.aiProvenance?.actor) return segment.aiProvenance.actor;
		return 'Unassigned';
	}

	function getLastEditedAt(segment: EditorSegment): string {
		if (segment.lastSavedAtIso) return formatTimestamp(segment.lastSavedAtIso);
		if (segment.aiProvenance?.generatedAtIso)
			return formatTimestamp(segment.aiProvenance.generatedAtIso);
		return 'Not yet edited';
	}

	function getSegmentWarnings(segmentId: string): TerminologyWarningItem[] {
		return terminologyWarningsBySegment[segmentId] ?? [];
	}

	function getSegmentComments(segmentId: string): ReviewerComment[] {
		return reviewerCommentsBySegment[segmentId] ?? [];
	}

	function getSegmentCommentCountLabel(segmentId: string): string {
		const count = getSegmentComments(segmentId).length;
		return count === 1 ? '1 comment' : `${count} comments`;
	}

	function getLatestSegmentComment(segmentId: string): ReviewerComment | undefined {
		const comments = getSegmentComments(segmentId);
		return comments[comments.length - 1];
	}

	function isSegmentActive(segmentId: string): boolean {
		return activeSegmentId === segmentId || Boolean(selection.selected[segmentId]);
	}

	function setActiveSegment(segmentId: string): void {
		activeSegmentId = segmentId;
	}

	function toggleSegment(id: string): void {
		selection = toggleSegmentSelection(selection, id);
		activeSegmentId = id;
	}

	function toggleAllSegments(): void {
		if (editorSegments.length === 0) return;

		const shouldSelectAll = selection.count !== editorSegments.length;
		const selected: Record<string, boolean> = {};

		for (const segment of editorSegments) {
			selected[segment.id] = shouldSelectAll;
		}

		selection = {
			selected,
			count: shouldSelectAll ? editorSegments.length : 0
		};

		if (shouldSelectAll) {
			activeSegmentId = editorSegments[0]?.id ?? activeSegmentId;
		}
	}

	function handleLanguageChange(lang: string): void {
		selectedLanguage = lang;
		saveTargetLanguage(story.storyId, lang);
		editorSegments = editorSegments.map((s) => ({ ...s, targetLanguage: lang }));
	}

	function handleTargetInput(segmentId: string): void {
		activeSegmentId = segmentId;
		editorSegments = editorSegments.map((segment) => {
			if (segment.id !== segmentId) {
				return segment;
			}

			return {
				...segment,
				status: segment.targetText.trim().length > 0 ? 'Draft' : segment.status
			};
		});

		markDirty();
	}

	function formatProvenanceScope(scope: string): string {
		if (scope === 'whole-story') return 'Whole story';
		if (scope === 'selected-chunk') return 'Selected chunk';
		return scope;
	}

	function buildSingleSegmentSelection(segmentId: string): SegmentSelectionModel {
		const selected: Record<string, boolean> = {};
		for (const segment of editorSegments) {
			selected[segment.id] = segment.id === segmentId;
		}

		return {
			selected,
			count: 1
		};
	}

	async function performDraft(
		selectionModel: SegmentSelectionModel,
		clearSelectionAfterDraft: boolean
	): Promise<void> {
		const selectedIds = editorSegments
			.filter((segment) => selectionModel.selected[segment.id])
			.map((segment) => segment.id);

		if (selectedIds.length === 0 || drafting) return;

		drafting = true;
		draftingSegmentIds = selectedIds;
		draftError = '';
		activeSegmentId = selectedIds[0] ?? activeSegmentId;

		try {
			const resolvedApiKey = apiKey ?? (import.meta.env.VITE_GEMINI_API_KEY as string) ?? '';
			editorSegments = await requestGeminiChunkDraft(
				editorSegments,
				selectionModel,
				selectedLanguage,
				story.storyId,
				resolvedApiKey
			);
			isDirty = true;
			saveMessage = '';
			if (clearSelectionAfterDraft) {
				selection = buildSegmentSelectionModel(editorSegments);
			}
		} catch (err) {
			draftError = err instanceof Error ? err.message : 'Draft failed';
		} finally {
			drafting = false;
			draftingSegmentIds = [];
		}
	}

	async function draftSelected(): Promise<void> {
		await performDraft(selection, true);
	}

	async function regenerateSegment(segmentId: string): Promise<void> {
		await performDraft(buildSingleSegmentSelection(segmentId), false);
	}

	function toggleSegmentComments(segmentId: string): void {
		expandedCommentSegments = {
			...expandedCommentSegments,
			[segmentId]: !expandedCommentSegments[segmentId]
		};
		activeSegmentId = segmentId;
	}

	function updateCommentDraft(segmentId: string, value: string): void {
		commentDrafts = {
			...commentDrafts,
			[segmentId]: value
		};
	}

	async function addSegmentComment(segmentId: string): Promise<void> {
		const message = commentDrafts[segmentId]?.trim();
		if (!message) return;

		commentMutationSegmentId = segmentId;
		commentError = null;

		try {
			const response = await fetch('/api/reviewer-comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storyId: story.storyId,
					authorId: ACTOR_ID,
					message,
					segmentId
				})
			});

			if (!response.ok) throw new Error('Failed to add comment');

			const data = (await response.json()) as { comment: ReviewerComment };
			reviewerComments = [...reviewerComments, data.comment];
			commentDrafts = {
				...commentDrafts,
				[segmentId]: ''
			};
			expandedCommentSegments = {
				...expandedCommentSegments,
				[segmentId]: true
			};
		} catch (err) {
			commentError = err instanceof Error ? err.message : 'Failed to add comment';
		} finally {
			commentMutationSegmentId = null;
		}
	}

	async function resolveSegmentComment(commentId: string, segmentId: string): Promise<void> {
		commentMutationSegmentId = segmentId;
		commentError = null;

		try {
			const response = await fetch('/api/reviewer-comments/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ storyId: story.storyId, commentId })
			});

			if (!response.ok) throw new Error('Failed to resolve comment');

			reviewerComments = reviewerComments.map((comment) =>
				comment.id === commentId ? { ...comment, resolved: true } : comment
			);
		} catch (err) {
			commentError = err instanceof Error ? err.message : 'Failed to resolve comment';
		} finally {
			commentMutationSegmentId = null;
		}
	}

	function saveChanges(): void {
		saving = true;
		const nowIso = new Date().toISOString();
		const draft = buildPersistedStoryDraft(story.storyId, ACTOR_ID, editorSegments, nowIso);
		savePersistedStoryDraft(draft);

		editorSegments = editorSegments.map((segment) => ({
			...segment,
			lastSavedByActorId: ACTOR_ID,
			lastSavedAtIso: nowIso
		}));

		lastSavedDraft = draft;
		isDirty = false;
		saveMessage = `Saved by ${ACTOR_ID} at ${nowIso}`;
		saving = false;
	}
</script>

<main class="editor">
	<section class="editor-shell">
		<header class="editor-toolbar" data-testid="editor-toolbar">
			<div class="toolbar-copy">
				<nav aria-label="breadcrumbs" class="breadcrumbs">
					Open Bible Stories / Story {story.storyId}
				</nav>
				<div class="toolbar-heading-row">
					<div>
						<h1>{story.storyId}: {story.title}</h1>
						<p class="editor-description">{story.description}</p>
					</div>
					<div class="story-meta-pills" aria-label="story-metadata">
						<span class="meta-pill">{editorSegments.length} segments</span>
						<span class="meta-pill meta-pill--accent">{selectedLanguage}</span>
						<span class="meta-pill">{selection.count} selected</span>
					</div>
				</div>
			</div>

			<div class="toolbar-actions" data-testid="save-bar">
				<div class="save-bar">
					<LanguageSelector
						storyId={story.storyId}
						value={selectedLanguage}
						onchange={handleLanguageChange}
					/>
					<button
						type="button"
						class="bulk-select-btn"
						onclick={toggleAllSegments}
						disabled={editorSegments.length === 0}
						data-testid="bulk-select-btn"
					>
						{selection.count === editorSegments.length && editorSegments.length > 0
							? 'Deselect All'
							: 'Select All'}
					</button>
					<button onclick={saveChanges} disabled={!isDirty || saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
					<button
						class="draft-btn"
						onclick={draftSelected}
						disabled={selection.count === 0 || drafting}
						data-testid="draft-selected-btn"
					>
						{drafting ? 'Drafting…' : `Draft Selected (${selection.count})`}
					</button>
					{#if isDirty}
						<span class="dirty-indicator">Unsaved changes</span>
					{/if}
					{#if saveMessage}
						<span class="save-message" data-testid="save-message">{saveMessage}</span>
					{/if}
					{#if draftError}
						<span class="draft-error" data-testid="draft-error">{draftError}</span>
					{/if}
					{#if commentError}
						<span class="draft-error">{commentError}</span>
					{/if}
				</div>

				<div class="toolbar-summary-row">
					{#if commentsLoading}
						<span class="summary-pill">Loading comments...</span>
					{:else if unresolvedCommentCount > 0}
						<span class="summary-pill summary-pill--accent"
							>{unresolvedCommentCount} open comments</span
						>
					{/if}
					{#if llmValidating}
						<span class="summary-pill">Validating consistency...</span>
					{:else if consistencyIssueCount > 0}
						<span class="summary-pill">{consistencyIssueCount} consistency checks</span>
					{/if}
					{#if storyLevelComments.length > 0}
						<span class="summary-pill">{storyLevelComments.length} story-level notes</span>
					{/if}
				</div>
			</div>
		</header>

		<section class="drafting-area" data-testid="drafting-area" aria-label="source-target-editor">
			{#each editorSegments as segment, index (segment.id)}
				{@const segmentWarnings = getSegmentWarnings(segment.id)}
				{@const segmentComments = getSegmentComments(segment.id)}
				{@const latestComment = getLatestSegmentComment(segment.id)}
				{@const active = isSegmentActive(segment.id)}
				{@const commentsExpanded = expandedCommentSegments[segment.id] ?? false}

				<article
					class="segment-card"
					class:segment-card--active={active}
					data-testid={`segment-card-${segment.id}`}
					data-active={active ? 'true' : 'false'}
				>
					<header class="segment-card-header">
						<div class="segment-title-block">
							<span class="segment-number">Segment {String(index + 1).padStart(2, '0')}</span>
							<div class="segment-heading-meta">
								<span class="segment-id">{segment.id}</span>
								<span class="segment-status-tag" data-testid={`segment-status-${segment.id}`}>
									{getSegmentStatusLabel(segment)}
								</span>
							</div>
						</div>

						<div class="segment-meta-block">
							<label class="select-label">
								<input
									type="checkbox"
									checked={selection.selected[segment.id]}
									onchange={() => toggleSegment(segment.id)}
									aria-label={`select-segment-${segment.id}`}
								/>
								Select
							</label>
						</div>
					</header>

					<section class="source-column" aria-label={`source-${segment.id}`}>
						<p class="source-text">{segment.sourceText}</p>
					</section>

					<section class="target-column" aria-label={`target-${segment.id}`}>
						<div class="segment-toolbox" data-testid={`segment-toolbox-${segment.id}`}>
							<div class="toolbox-meta-row">
								<span class="language-chip">{segment.targetLanguage}</span>
								{#if segmentComments.length > 0}
									<span class="comment-chip">{getSegmentCommentCountLabel(segment.id)}</span>
								{/if}
							</div>

							{#if segmentWarnings.length > 0}
								<div class="toolbox-warnings">
									{#each segmentWarnings as warning (`${warning.segmentId}:${warning.sourceTerm}:${warning.expectedTargetTerm}`)}
										<div class="segment-warning" data-testid={`segment-warning-${segment.id}`}>
											Use "{warning.expectedTargetTerm}" for "{warning.sourceTerm}" in this segment.
										</div>
									{/each}
								</div>
							{/if}

							<div class="segment-actions">
								<button
									type="button"
									class="segment-action segment-action--primary"
									onclick={(event) => {
										event.stopPropagation();
										void regenerateSegment(segment.id);
									}}
								>
									Regenerate draft
								</button>
								<button
									type="button"
									class="segment-action segment-action--secondary"
									data-testid={`segment-comments-toggle-${segment.id}`}
									onclick={(event) => {
										event.stopPropagation();
										toggleSegmentComments(segment.id);
									}}
								>
									Comments
								</button>
							</div>

							{#if latestComment}
								<div class="comment-preview">
									<span class="comment-preview-kicker">Latest comment</span>
									<p>{latestComment.message}</p>
								</div>
							{/if}
						</div>

						{#if draftingSegmentIds.includes(segment.id)}
							<div
								class="skeleton"
								aria-label="generating draft"
								data-testid="skeleton-{segment.id}"
							>
								<div class="skeleton-line"></div>
								<div class="skeleton-line skeleton-line--short"></div>
								<div class="skeleton-line"></div>
							</div>
						{:else}
							<textarea
								rows="6"
								placeholder="Start translating or use AI draft..."
								bind:value={segment.targetText}
								onfocus={() => setActiveSegment(segment.id)}
								oninput={() => handleTargetInput(segment.id)}
								aria-label={`target-${segment.id}`}
							></textarea>
						{/if}

						{#if commentsExpanded}
							<div class="segment-comments" data-testid={`segment-comments-${segment.id}`}>
								<div class="segment-comments-header">
									<h2>Comments on this segment</h2>
									<span
										>{segmentComments.length > 0
											? getSegmentCommentCountLabel(segment.id)
											: 'No comments yet'}</span
									>
								</div>

								{#if segmentComments.length === 0}
									<p class="comments-empty">No comments on this segment yet.</p>
								{:else}
									<div class="segment-comment-list">
										{#each segmentComments as comment (comment.id)}
											<article
												class="segment-comment"
												class:segment-comment--resolved={comment.resolved}
											>
												<div class="segment-comment-meta">
													<strong>{comment.authorId}</strong>
													<span>{formatTimestamp(comment.createdAt)}</span>
													{#if comment.resolved}
														<span class="comment-resolved-tag">Resolved</span>
													{:else}
														<button
															type="button"
															class="comment-resolve-btn"
															disabled={commentMutationSegmentId === segment.id}
															onclick={(event) => {
																event.stopPropagation();
																void resolveSegmentComment(comment.id, segment.id);
															}}
														>
															Resolve
														</button>
													{/if}
												</div>
												<p>{comment.message}</p>
											</article>
										{/each}
									</div>
								{/if}

								<div class="segment-comment-composer">
									<label class="comment-label" for={`comment-input-${segment.id}`}>Add note</label>
									<textarea
										id={`comment-input-${segment.id}`}
										rows="2"
										placeholder="Add a comment for this segment..."
										value={commentDrafts[segment.id] ?? ''}
										onclick={(event) => event.stopPropagation()}
										oninput={(event) =>
											updateCommentDraft(
												segment.id,
												(event.currentTarget as HTMLTextAreaElement).value
											)}
									></textarea>
									<button
										type="button"
										class="segment-action segment-action--secondary"
										disabled={commentMutationSegmentId === segment.id ||
											!(commentDrafts[segment.id] ?? '').trim()}
										onclick={(event) => {
											event.stopPropagation();
											void addSegmentComment(segment.id);
										}}
									>
										{commentMutationSegmentId === segment.id ? 'Saving note...' : 'Add note'}
									</button>
								</div>
							</div>
						{/if}
					</section>
				</article>
			{/each}
		</section>
	</section>
</main>

<style>
	.editor {
		display: flex;
		height: calc(100vh - 4.75rem);
		background: transparent;
		width: 100%;
		overflow: hidden;
	}

	.editor-shell {
		display: flex;
		flex: 1;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.editor-toolbar {
		flex-shrink: 0;
		padding: 1.2rem 1.5rem 1rem;
		background: var(--color-surface);
		color: var(--color-on-surface);
		border-bottom: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-subtle);
		backdrop-filter: blur(16px);
	}

	.drafting-area {
		flex: 1;
		overflow-y: auto;
		padding: 1.1rem 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.breadcrumbs {
		margin-bottom: 0.4rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
	}

	.toolbar-heading-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.toolbar-heading-row h1 {
		margin-bottom: 0.25rem;
		color: var(--color-on-surface);
	}

	.editor-description {
		max-width: 58ch;
		margin-bottom: 0;
		color: var(--color-on-surface-variant);
	}

	.story-meta-pills {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.55rem;
	}

	.meta-pill {
		display: inline-flex;
		align-items: center;
		min-height: 2rem;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.meta-pill--accent {
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
	}

	.toolbar-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.save-bar {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
		padding: 0.95rem;
		margin-top: 0.75rem;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.1rem;
	}

	.toolbar-summary-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.summary-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface-variant);
		font-size: 0.76rem;
		font-weight: 700;
	}

	.summary-pill--accent {
		background: var(--color-surface-container-low);
		border-color: var(--color-outline-variant);
		color: var(--color-on-surface);
	}

	button {
		font-size: 0.82rem;
		letter-spacing: 0.01em;
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.draft-btn {
		background: linear-gradient(
			180deg,
			var(--color-primary-container) 0%,
			var(--color-primary) 100%
		);
		border-color: var(--color-primary);
		color: var(--color-on-primary);
	}

	.bulk-select-btn {
		background: var(--color-surface);
		border-color: var(--color-outline-variant);
		color: var(--color-primary);
		box-shadow: none;
	}

	.dirty-indicator {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-error);
	}

	.save-message {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.draft-error {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-error);
	}

	.segment-card {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem 1rem;
		padding: 1.25rem;
		border-radius: 1.35rem;
		border: 1px solid var(--color-outline-variant);
		background: var(--color-surface-container);
		color: var(--color-on-surface);
		box-shadow: var(--shadow-subtle);
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			background-color 0.2s ease;
	}

	.segment-card--active {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-medium);
		background: var(--color-surface-container-high);
	}

	.segment-card-header {
		grid-column: 1 / -1;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
	}

	.segment-title-block {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.segment-heading-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.segment-id {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--color-on-surface-variant);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.segment-status-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
		color: var(--color-primary);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.segment-meta-block {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.segment-meta-item {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--color-on-surface-variant);
	}

	.select-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		color: var(--color-on-surface-variant);
	}

	.source-column,
	.target-column {
		padding: 0.85rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 1.15rem;
		background: var(--color-surface-container-lowest);
		box-shadow: var(--shadow-subtle);
	}

	.source-column {
		background: var(--color-surface-container-lowest);
	}

	.target-column {
		background: var(--color-surface-container-lowest);
	}

	.segment-toolbox {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem;
		margin-bottom: 0.5rem;
		border-radius: 0.5rem;
		background: var(--color-surface-container-low);
		border: 1px solid var(--color-outline-variant);
	}

	.toolbox-meta-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.comment-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.28rem 0.65rem;
		border-radius: 999px;
		background: var(--color-surface-container);
		color: var(--color-primary);
		font-size: 0.73rem;
		font-weight: 700;
	}

	.toolbox-warnings {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.segment-warning {
		padding: 0.7rem 0.8rem;
		border-radius: 0.85rem;
		background: var(--color-error-container);
		border: 1px solid var(--color-error);
		font-size: 0.84rem;
		font-weight: 700;
		color: var(--color-on-error);
	}

	.segment-actions {
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.segment-action {
		min-height: 1.75rem;
		font-size: 0.75rem;
		padding: 0.25rem 0.6rem;
	}

	.segment-action--primary {
		background: linear-gradient(
			180deg,
			var(--color-primary-container) 0%,
			var(--color-primary) 100%
		);
		border-color: var(--color-primary);
		color: var(--color-on-primary);
	}

	.segment-action--secondary {
		background: var(--color-surface);
		border-color: var(--color-outline-variant);
		color: var(--color-on-surface);
		box-shadow: none;
	}

	.comment-preview {
		padding: 0.8rem 0.85rem;
		border-radius: 0.9rem;
		background: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
	}

	.comment-preview-kicker {
		display: inline-flex;
		margin-bottom: 0.4rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
	}

	.comment-preview p {
		margin-bottom: 0;
		font-size: 0.92rem;
		color: var(--color-on-surface);
	}

	.segment-number {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-on-surface-variant);
		letter-spacing: 0.12em;
	}

	.source-text {
		margin-bottom: 0;
		font-family: var(--font-serif);
		font-size: 1.08rem;
		line-height: 1.75;
		color: var(--color-on-surface);
	}

	.language-chip {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.language-chip {
		color: var(--color-primary);
	}

	textarea {
		width: 100%;
		min-height: 6rem;
		border: 1px solid var(--color-outline-variant);
		border-radius: 1rem;
		padding: 0.95rem 1rem;
		background: var(--color-surface-container-lowest);
		font-family: var(--font-serif);
		font-size: 1.04rem;
		line-height: 1.7;
		color: var(--color-on-surface);
	}

	.segment-comments {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-outline-variant);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.segment-comments-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.segment-comments-header h2 {
		margin: 0;
		font-size: 0.95rem;
	}

	.segment-comments-header span {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--color-on-surface-variant);
	}

	.comments-empty {
		margin-bottom: 0;
		color: var(--color-on-surface-variant);
	}

	.segment-comment-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.segment-comment {
		padding: 0.85rem 0.95rem;
		border-radius: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
	}

	.segment-comment--resolved {
		opacity: 0.72;
	}

	.segment-comment-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 0.45rem;
	}

	.segment-comment-meta strong {
		font-size: 0.84rem;
	}

	.segment-comment-meta span {
		font-size: 0.76rem;
		color: var(--color-on-surface-variant);
	}

	.segment-comment p {
		margin-bottom: 0;
		font-size: 0.92rem;
		color: var(--color-on-surface);
	}

	.comment-resolved-tag {
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		background: rgba(95, 164, 255, 0.16);
		color: var(--color-primary);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.comment-resolve-btn {
		margin-left: auto;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		background: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
		color: var(--color-primary);
		box-shadow: none;
	}

	.segment-comment-composer {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.comment-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-on-surface-variant);
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0;
	}

	.skeleton-line {
		height: 1rem;
		border-radius: 0.25rem;
		background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-line--short {
		width: 60%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.provenance {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-on-surface-variant);
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	@media (max-width: 900px) {
		.segment-card {
			grid-template-columns: 1fr;
		}

		.editor {
			height: auto;
			min-height: calc(100vh - 4.75rem);
			overflow: visible;
		}

		.editor-toolbar {
			padding: 1rem;
		}

		.drafting-area {
			padding: 1rem;
			overflow: visible;
		}

		.toolbar-heading-row {
			flex-direction: column;
			gap: 0.75rem;
		}

		.story-meta-pills {
			display: flex;
			flex-wrap: nowrap;
			justify-content: flex-start;
			gap: 0.5rem;
			overflow-x: auto;
			padding-bottom: 0.25rem;
			margin-bottom: -0.25rem;
		}

		.story-meta-pills::-webkit-scrollbar {
			display: none;
		}

		.story-meta-pills {
			-ms-overflow-style: none;
			scrollbar-width: none;
		}

		.meta-pill {
			flex: 0 0 auto;
		}

		.segment-card-header,
		.segment-meta-block,
		.segment-comments-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
