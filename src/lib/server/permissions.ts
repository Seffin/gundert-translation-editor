export type UserRole = 'Translator' | 'Reviewer' | 'Lead';

export type PermissionAction =
	| 'editTranslation'
	| 'saveDraft'
	| 'requestAIDraft'
	| 'submitForReview'
	| 'resolveReview'
	| 'returnToDraft'
	| 'approveStory'
	| 'viewReviewerQueue'
	| 'viewLeadGate';

const PERMISSION_MATRIX: Record<UserRole, Record<PermissionAction, boolean>> = {
	Translator: {
		editTranslation: true,
		saveDraft: true,
		requestAIDraft: true,
		submitForReview: true,
		resolveReview: false,
		returnToDraft: false,
		approveStory: false,
		viewReviewerQueue: false,
		viewLeadGate: false
	},
	Reviewer: {
		editTranslation: false,
		saveDraft: false,
		requestAIDraft: false,
		submitForReview: false,
		resolveReview: true,
		returnToDraft: true,
		approveStory: false,
		viewReviewerQueue: true,
		viewLeadGate: false
	},
	Lead: {
		editTranslation: false,
		saveDraft: false,
		requestAIDraft: false,
		submitForReview: false,
		resolveReview: false,
		returnToDraft: false,
		approveStory: true,
		viewReviewerQueue: false,
		viewLeadGate: true
	}
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
	return PERMISSION_MATRIX[role][action];
}

export function listAllowedActions(role: UserRole): PermissionAction[] {
	return (Object.entries(PERMISSION_MATRIX[role]) as Array<[PermissionAction, boolean]>)
		.filter(([, allowed]) => allowed)
		.map(([action]) => action);
}