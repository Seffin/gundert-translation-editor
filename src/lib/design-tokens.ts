/**
 * Design System Tokens
 * Based on Editorial Translation System design language
 */

/* Colors */
export const COLORS = {
	// Primary
	primary: '#161c54',
	onPrimary: '#ffffff',
	primaryContainer: '#2d336b',
	onPrimaryContainer: '#979ddd',

	// Secondary
	secondary: '#316763',
	onSecondary: '#ffffff',
	secondaryContainer: '#b5ede7',
	onSecondaryContainer: '#376d69',

	// Error
	error: '#ba1a1a',
	onError: '#ffffff',
	errorContainer: '#ffdad6',

	// Surface (cream background - warm, editorial feel)
	surface: '#fbf8fe',
	surfaceDim: '#dcd9de',
	surfaceBright: '#fbf8fe',
	surfaceContainerLowest: '#ffffff',
	surfaceContainerLow: '#f6f2f8',
	surfaceContainer: '#f0edf2',
	surfaceContainerHigh: '#eae7ed',
	surfaceContainerHighest: '#e4e1e7',

	// On Surface
	onSurface: '#1b1b1f',
	onSurfaceVariant: '#46464f',

	// Outline
	outline: '#777681',
	outlineVariant: '#c7c5d1',

	// Background
	background: '#fbf8fe',
	onBackground: '#1b1b1f'
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
