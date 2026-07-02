/**
 * Single source of truth for the overlay appearance color tokens.
 *
 * These `--ov-*` custom properties are the override layer read by the base themes
 * (`decktracker-theme` / `battlegrounds-theme`), e.g. `--color-1: var(--ov-color-1, #9fb6d7)`.
 * Setting an `--ov-*` token (from a builtin theme SCSS file, or inline via the
 * OverlayAppearanceService for custom/user themes) re-colors every overlay widget,
 * including the ones that re-declare their own game-mode theme class.
 *
 * `overlay-themes/_contract.scss` mirrors this list as comments for SCSS theme authors.
 */
export type OverlayAppearanceColorGroup = 'palette' | 'text' | 'bgs-background';

export type OverlayAppearanceGameMode = 'both' | 'decktracker' | 'battlegrounds';

export interface OverlayAppearanceColorField {
	/** The `--ov-*` custom property name. */
	readonly key: string;
	/** i18n key for the picker label. */
	readonly labelKey: string;
	readonly group: OverlayAppearanceColorGroup;
	/** Which game mode(s) the token affects (used to group the pickers in the UI). */
	readonly gameMode: OverlayAppearanceGameMode;
}

export const OVERLAY_APPEARANCE_COLOR_CONTRACT = [
	// Palette
	{ key: '--ov-color-1', labelKey: 'settings.general.appearance.overlay-theme.color.color-1', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-2', labelKey: 'settings.general.appearance.overlay-theme.color.color-2', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-3', labelKey: 'settings.general.appearance.overlay-theme.color.color-3', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-4', labelKey: 'settings.general.appearance.overlay-theme.color.color-4', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-5', labelKey: 'settings.general.appearance.overlay-theme.color.color-5', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-6', labelKey: 'settings.general.appearance.overlay-theme.color.color-6', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-7', labelKey: 'settings.general.appearance.overlay-theme.color.color-7', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-8', labelKey: 'settings.general.appearance.overlay-theme.color.color-8', group: 'palette', gameMode: 'battlegrounds' },
	{ key: '--ov-color-9', labelKey: 'settings.general.appearance.overlay-theme.color.color-9', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-common-1', labelKey: 'settings.general.appearance.overlay-theme.color.common-1', group: 'palette', gameMode: 'both' },
	{ key: '--ov-color-common-2', labelKey: 'settings.general.appearance.overlay-theme.color.common-2', group: 'palette', gameMode: 'both' },
	// Text / titles
	{ key: '--ov-default-text-color', labelKey: 'settings.general.appearance.overlay-theme.color.text', group: 'text', gameMode: 'both' },
	{ key: '--ov-default-title-color', labelKey: 'settings.general.appearance.overlay-theme.color.title', group: 'text', gameMode: 'both' },
	{ key: '--ov-secondary-text-color', labelKey: 'settings.general.appearance.overlay-theme.color.secondary-text', group: 'text', gameMode: 'both' },
	// Battlegrounds widget backgrounds
	{ key: '--ov-bgs-widget-background-color-start', labelKey: 'settings.general.appearance.overlay-theme.color.bgs-background-start', group: 'bgs-background', gameMode: 'battlegrounds' },
	{ key: '--ov-bgs-widget-background-color-end', labelKey: 'settings.general.appearance.overlay-theme.color.bgs-background-end', group: 'bgs-background', gameMode: 'battlegrounds' },
] as const satisfies readonly OverlayAppearanceColorField[];

export type OverlayAppearanceColorKey = (typeof OVERLAY_APPEARANCE_COLOR_CONTRACT)[number]['key'];

export type OverlayAppearancePalette = Partial<Record<OverlayAppearanceColorKey, string>>;

export const OVERLAY_APPEARANCE_COLOR_KEYS: readonly OverlayAppearanceColorKey[] =
	OVERLAY_APPEARANCE_COLOR_CONTRACT.map((field) => field.key);

export const isOverlayAppearanceColorKey = (key: string): key is OverlayAppearanceColorKey =>
	OVERLAY_APPEARANCE_COLOR_KEYS.includes(key as OverlayAppearanceColorKey);

/**
 * The base game-mode theme class used to compute the default value of each token
 * (via `getComputedStyle`). Both classes resolve the same `--ov-*` fallbacks, so either
 * works; we probe both so the defaults reflect the mode the token targets.
 */
export const overlayAppearanceProbeClassForField = (field: OverlayAppearanceColorField): string =>
	field.gameMode === 'battlegrounds' ? 'battlegrounds-theme' : 'decktracker-theme';
