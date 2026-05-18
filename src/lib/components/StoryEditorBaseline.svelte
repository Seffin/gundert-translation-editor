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
	import {
		loadTargetLanguage,
		saveTargetLanguage
	} from '$lib/client/target-language';
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

	function groupReviewerCommentsBySegment(comments: ReviewerComment[]): Record<string, ReviewerComment[]> {
		return comments.reduce<Record<string, ReviewerComment[]>>((groups, comment) => {
			const key = comment.segmentId ?? STORY_COMMENTS_KEY;
			groups[key] = [...(groups[key] ?? []), comment];
			return groups;
		}, {});
	}

	let { story, glossaryTerms = [], apiKey = null } = $props<{ story: StoryEditorModel; glossaryTerms?: GlossaryTerm[]; apiKey?: string | null }>();

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
		if (segment.aiProvenance?.generatedAtIso) return formatTimestamp(segment.aiProvenance.generatedAtIso);
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
			const resolvedApiKey = apiKey ?? ((import.meta.env.VITE_GEMINI_API_KEY as string) ?? '');
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
				<nav aria-label="breadcrumbs" class="breadcrumbs">Open Bible Stories / Story {story.storyId}</nav>
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
					<LanguageSelector storyId={story.storyId} value={selectedLanguage} onchange={handleLanguageChange} />
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
						<span class="summary-pill summary-pill--accent">{unresolvedCommentCount} open comments</span>
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
							<span class="segment-meta-item">Last edited by {getLastEditedBy(segment)}</span>
							<span class="segment-meta-item">{getLastEditedAt(segment)}</span>
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
							<div class="skeleton" aria-label="generating draft" data-testid="skeleton-{segment.id}">
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

						{#if segment.draftedByGemini && segment.aiProvenance}
							<div class="provenance">
								AI DRAFT • {segment.aiProvenance.actor} • {formatProvenanceScope(segment.aiProvenance.scope)} • {segment.aiProvenance.generatedAtLabel}
							</div>
						{:else if segment.draftedByGemini}
							<div class="provenance">AI DRAFT • Gemini • Whole story • {segment.updatedAtLabel}</div>
						{/if}

						{#if commentsExpanded}
							<div class="segment-comments" data-testid={`segment-comments-${segment.id}`}>
								<div class="segment-comments-header">
									<h2>Comments on this segment</h2>
									<span>{segmentComments.length > 0 ? getSegmentCommentCountLabel(segment.id) : 'No comments yet'}</span>
								</div>

								{#if segmentComments.length === 0}
									<p class="comments-empty">No comments on this segment yet.</p>
								{:else}
									<div class="segment-comment-list">
										{#each segmentComments as comment (comment.id)}
											<article class="segment-comment" class:segment-comment--resolved={comment.resolved}>
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
											updateCommentDraft(segment.id, (event.currentTarget as HTMLTextAreaElement).value)}
									></textarea>
									<button
										type="button"
										class="segment-action segment-action--secondary"
										disabled={commentMutationSegmentId === segment.id || !(commentDrafts[segment.id] ?? '').trim()}
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
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 248, 255, 0.95));
		border-bottom: 1px solid rgba(207, 218, 234, 0.95);
		box-shadow: 0 10px 32px rgba(20, 63, 126, 0.08);
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
		margin-bottom: 0.8rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #56708f;
	}

	.toolbar-heading-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.toolbar-heading-row h1 {
		margin-bottom: 0.45rem;
	}

	.editor-description {
		max-width: 58ch;
		margin-bottom: 0;
		color: #53647a;
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
		background: rgba(20, 86, 217, 0.08);
		border: 1px solid rgba(20, 86, 217, 0.14);
		color: #255187;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.meta-pill--accent {
		background: linear-gradient(180deg, rgba(20, 86, 217, 0.15), rgba(95, 164, 255, 0.14));
		color: #0d3f9e;
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
		background: rgba(239, 245, 252, 0.86);
		border: 1px solid rgba(207, 218, 234, 0.9);
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
		background: rgba(20, 86, 217, 0.08);
		border: 1px solid rgba(20, 86, 217, 0.12);
		color: #35537a;
		font-size: 0.76rem;
		font-weight: 700;
	}

	.summary-pill--accent {
		background: rgba(255, 236, 173, 0.7);
		border-color: rgba(227, 160, 8, 0.18);
		color: #8f5e0b;
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
		background: linear-gradient(180deg, #2d7cff 0%, #1456d9 100%);
		border-color: #1456d9;
	}

	.bulk-select-btn {
		background: rgba(20, 86, 217, 0.08);
		border-color: rgba(20, 86, 217, 0.18);
		color: #1456d9;
		box-shadow: none;
	}

	.dirty-indicator {
		font-size: 0.8rem;
		font-weight: 700;
		color: #9a3412;
	}

	.save-message {
		font-size: 0.8rem;
		font-weight: 700;
		color: #1456d9;
	}

	.draft-error {
		font-size: 0.8rem;
		font-weight: 700;
		color: #b42318;
	}

	.segment-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 1.35rem;
		border: 1px solid rgba(207, 218, 234, 0.92);
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 14px 28px rgba(20, 63, 126, 0.06);
		transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
	}

	.segment-card--active {
		border-color: rgba(20, 86, 217, 0.42);
		box-shadow: 0 22px 40px rgba(20, 86, 217, 0.12);
		background: linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(255, 255, 255, 0.98));
	}

	.segment-card-header {
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
		color: #69829e;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.segment-status-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		background: rgba(20, 86, 217, 0.08);
		border: 1px solid rgba(20, 86, 217, 0.12);
		color: #1456d9;
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
		color: #5a7390;
	}

	.select-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		color: #53647a;
	}

	.source-column,
	.target-column {
		padding: 1.15rem;
		border: 1px solid rgba(207, 218, 234, 0.92);
		border-radius: 1.15rem;
		background: rgba(255, 255, 255, 0.88);
		box-shadow: 0 10px 24px rgba(20, 63, 126, 0.05);
	}

	.source-column {
		background: linear-gradient(180deg, rgba(246, 250, 255, 0.96), rgba(255, 255, 255, 0.98));
	}

	.target-column {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.96));
	}

	.segment-toolbox {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 0.9rem 1rem;
		margin-bottom: 0.9rem;
		border-radius: 1rem;
		background: rgba(239, 245, 252, 0.86);
		border: 1px solid rgba(207, 218, 234, 0.95);
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
		background: rgba(20, 86, 217, 0.1);
		color: #255187;
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
		background: linear-gradient(180deg, rgba(255, 246, 243, 1), rgba(255, 251, 249, 1));
		border: 1px solid rgba(255, 186, 166, 0.76);
		font-size: 0.84rem;
		font-weight: 700;
		color: #a0381b;
	}

	.segment-actions {
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.segment-action {
		min-height: 2.25rem;
	}

	.segment-action--primary {
		background: linear-gradient(180deg, #2d7cff 0%, #1456d9 100%);
		border-color: #1456d9;
	}

	.segment-action--secondary {
		background: rgba(255, 255, 255, 0.82);
		border-color: rgba(20, 86, 217, 0.18);
		color: #1456d9;
		box-shadow: none;
	}

	.comment-preview {
		padding: 0.8rem 0.85rem;
		border-radius: 0.9rem;
		background: rgba(255, 255, 255, 0.84);
		border: 1px solid rgba(207, 218, 234, 0.95);
	}

	.comment-preview-kicker {
		display: inline-flex;
		margin-bottom: 0.4rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5a7390;
	}

	.comment-preview p {
		margin-bottom: 0;
		font-size: 0.92rem;
		color: #31455f;
	}

	.segment-number {
		font-size: 0.75rem;
		font-weight: 700;
		color: #5a7390;
		letter-spacing: 0.12em;
	}

	.source-text {
		margin-bottom: 0;
		font-family: var(--font-serif);
		font-size: 1.08rem;
		line-height: 1.75;
		color: #22354c;
	}

	.language-chip {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.language-chip {
		color: #1456d9;
	}

	textarea {
		width: 100%;
		min-height: 11rem;
		border: 1px solid rgba(199, 214, 235, 0.95);
		border-radius: 1rem;
		padding: 0.95rem 1rem;
		background: #fbfdff;
		font-family: var(--font-serif);
		font-size: 1.04rem;
		line-height: 1.7;
		color: #22354c;
	}

	.segment-comments {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(207, 218, 234, 0.92);
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
		color: #5a7390;
	}

	.comments-empty {
		margin-bottom: 0;
		color: #5a7390;
	}

	.segment-comment-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.segment-comment {
		padding: 0.85rem 0.95rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.88);
		border: 1px solid rgba(207, 218, 234, 0.95);
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
		color: #69829e;
	}

	.segment-comment p {
		margin-bottom: 0;
		font-size: 0.92rem;
		color: #22354c;
	}

	.comment-resolved-tag {
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		background: rgba(95, 164, 255, 0.16);
		color: #1456d9;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.comment-resolve-btn {
		margin-left: auto;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(20, 86, 217, 0.18);
		color: #1456d9;
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
		color: #35537a;
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
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.provenance {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #5a7390;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	@media (max-width: 900px) {
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
		}

		.story-meta-pills {
			justify-content: flex-start;
		}

		.segment-card-header,
		.segment-meta-block,
		.segment-comments-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
