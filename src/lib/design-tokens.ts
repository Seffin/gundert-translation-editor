/**
 * Design System Tokens
 * Based on Editorial Translation System design language
 */

/* Colors */
export const COLORS = {
	// Primary
	primary: '#1456d9',
	onPrimary: '#ffffff',
	primaryContainer: '#0d3f9e',
	onPrimaryContainer: '#d7e7ff',

	// Secondary
	secondary: '#2f6fb4',
	onSecondary: '#ffffff',
	secondaryContainer: '#d9ebff',
	onSecondaryContainer: '#1f4f86',

	// Error
	error: '#ba1a1a',
	onError: '#ffffff',
	errorContainer: '#ffe0dd',

	// Surface
	surface: '#f7faff',
	surfaceDim: '#d8e3f2',
	surfaceBright: '#f7faff',
	surfaceContainerLowest: '#ffffff',
	surfaceContainerLow: '#eef4fb',
	surfaceContainer: '#e5eef8',
	surfaceContainerHigh: '#dce8f5',
	surfaceContainerHighest: '#d3e1f1',

	// On Surface
	onSurface: '#182538',
	onSurfaceVariant: '#53647a',

	// Outline
	outline: '#8ea3bf',
	outlineVariant: '#cfdaea',

	// Background
	background: '#edf4fb',
	onBackground: '#132033'
};

/* Typography */
export const FONTS = {
	serif: 'Newsreader, Georgia, serif',
	sansSerif: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export const TYPOGRAPHY = {
	displayLg: {
		fontFamily: FONTS.serif,
		fontSize: '40px',
		fontWeight: '600',
		lineHeight: '1.2'
	},
	sourceText: {
		fontFamily: FONTS.serif,
		fontSize: '18px',
		fontWeight: '400',
		lineHeight: '1.7'
	},
	targetText: {
		fontFamily: FONTS.serif,
		fontSize: '18px',
		fontWeight: '400',
		lineHeight: '1.7'
	},
	uiLabelMd: {
		fontFamily: FONTS.sansSerif,
		fontSize: '14px',
		fontWeight: '600',
		lineHeight: '1.4'
	},
	uiBodySm: {
		fontFamily: FONTS.sansSerif,
		fontSize: '13px',
		fontWeight: '400',
		lineHeight: '1.5'
	},
	metadata: {
		fontFamily: FONTS.sansSerif,
		fontSize: '11px',
		fontWeight: '700',
		lineHeight: '1.2',
		letterSpacing: '0.05em'
	}
};

/* Spacing */
export const SPACING = {
	unit: '8px',
	xs: '4px',
	sm: '8px',
	md: '16px',
	lg: '24px',
	xl: '32px',
	xxl: '48px',
	xxxl: '64px'
};

/* Border Radius */
export const RADIUS = {
	xs: '0.125rem',
	sm: '0.25rem',
	md: '0.375rem',
	lg: '0.5rem',
	xl: '0.75rem',
	full: '9999px'
};
