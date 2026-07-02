/**
 * Registry of the overlay appearance themes (the look & feel of the in-game overlays:
 * deck tracker, counters, battle odds, minions list, etc.).
 *
 * Adding a new *builtin* theme only requires:
 *   1. a new entry in {@link BUILTIN_OVERLAY_APPEARANCE_THEMES}
 *   2. a matching SCSS file in `libs/shared/styles/src/lib/styles/overlay-themes/{id}.scss`
 *      that sets the `--ov-*` tokens under `[data-overlay-appearance='{id}']`
 *   3. a `@forward` in `overlay-themes/_index.scss`
 *   4. an i18n label under the `labelKey`
 *
 * The `custom` theme has no SCSS file: its palette is applied at runtime by the
 * OverlayAppearanceService. User-saved themes are referenced as `user:{uuid}`.
 */
export interface BuiltinOverlayThemeDefinition {
	readonly id: string;
	readonly labelKey: string;
	/** When true, the theme exposes the custom color editor (no SCSS palette of its own). */
	readonly isCustom?: boolean;
}

export const BUILTIN_OVERLAY_APPEARANCE_THEMES = [
	{ id: 'firestone', labelKey: 'settings.general.appearance.overlay-theme.firestone' },
	{ id: 'deck-tracker', labelKey: 'settings.general.appearance.overlay-theme.deck-tracker' },
	{ id: 'dark', labelKey: 'settings.general.appearance.overlay-theme.dark' },
	{ id: 'firestone-dark', labelKey: 'settings.general.appearance.overlay-theme.firestone-dark' },
	{ id: 'custom', labelKey: 'settings.general.appearance.overlay-theme.custom', isCustom: true },
] as const satisfies readonly BuiltinOverlayThemeDefinition[];

export type BuiltinOverlayThemeId = (typeof BUILTIN_OVERLAY_APPEARANCE_THEMES)[number]['id'];

/** Prefix used to reference a user-saved theme in the preference. */
export const USER_OVERLAY_THEME_PREFIX = 'user:';
export type UserOverlayThemeSelection = `${typeof USER_OVERLAY_THEME_PREFIX}${string}`;

export type OverlayAppearanceThemeSelection = BuiltinOverlayThemeId | UserOverlayThemeSelection;

export const DEFAULT_OVERLAY_APPEARANCE_THEME: BuiltinOverlayThemeId = 'firestone';

export const isUserOverlayTheme = (
	selection: OverlayAppearanceThemeSelection | null | undefined,
): selection is UserOverlayThemeSelection => !!selection && selection.startsWith(USER_OVERLAY_THEME_PREFIX);

export const getUserOverlayThemeId = (selection: OverlayAppearanceThemeSelection): string | null =>
	isUserOverlayTheme(selection) ? selection.slice(USER_OVERLAY_THEME_PREFIX.length) : null;

/** The custom color editor is shown for the `custom` theme and for any user-saved theme. */
export const usesCustomPalette = (
	selection: OverlayAppearanceThemeSelection | null | undefined,
): boolean => selection === 'custom' || isUserOverlayTheme(selection);

/** Whether the given selection maps to a builtin SCSS theme (i.e. relies on `data-overlay-appearance`). */
export const isBuiltinOverlayTheme = (
	selection: OverlayAppearanceThemeSelection | null | undefined,
): selection is BuiltinOverlayThemeId =>
	!!selection && BUILTIN_OVERLAY_APPEARANCE_THEMES.some((theme) => theme.id === selection);
