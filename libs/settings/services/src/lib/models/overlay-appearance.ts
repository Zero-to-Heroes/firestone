import {
	OVERLAY_APPEARANCE_COLOR_CONTRACT,
	OverlayAppearanceColorKey,
	OverlayAppearancePalette,
	isOverlayAppearanceColorKey,
	overlayAppearanceProbeClassForField,
} from '@firestone/shared/common/service';

/** A user-saved overlay theme (a named custom palette), persisted locally and shareable via JSON. */
export interface SavedOverlayTheme {
	readonly id: string;
	readonly name: string;
	readonly colors: OverlayAppearancePalette;
	readonly updatedAt: number;
}

export const OVERLAY_THEME_EXPORT_TYPE = 'firestone-overlay-theme';
export const OVERLAY_THEME_EXPORT_VERSION = 1;

interface OverlayThemeExportEnvelope {
	readonly type: typeof OVERLAY_THEME_EXPORT_TYPE;
	readonly version: number;
	readonly name: string;
	readonly colors: OverlayAppearancePalette;
}

/** Keeps only known contract keys with non-empty string values. */
export const sanitizePalette = (palette: OverlayAppearancePalette | null | undefined): OverlayAppearancePalette => {
	const result: Record<string, string> = {};
	if (palette) {
		for (const [key, value] of Object.entries(palette)) {
			if (isOverlayAppearanceColorKey(key) && typeof value === 'string' && value.trim().length) {
				result[key] = value.trim();
			}
		}
	}
	return result as OverlayAppearancePalette;
};

export const exportOverlayThemeToJson = (name: string, colors: OverlayAppearancePalette): string => {
	const envelope: OverlayThemeExportEnvelope = {
		type: OVERLAY_THEME_EXPORT_TYPE,
		version: OVERLAY_THEME_EXPORT_VERSION,
		name: name,
		colors: sanitizePalette(colors),
	};
	return JSON.stringify(envelope, null, 2);
};

export interface ParsedOverlayTheme {
	readonly name: string;
	readonly colors: OverlayAppearancePalette;
}

/** Parses a theme JSON exported by {@link exportOverlayThemeToJson}. Returns null if invalid. */
export const parseImportedOverlayTheme = (json: string): ParsedOverlayTheme | null => {
	try {
		const parsed = JSON.parse(json) as Partial<OverlayThemeExportEnvelope>;
		if (parsed?.type !== OVERLAY_THEME_EXPORT_TYPE) {
			return null;
		}
		const colors = sanitizePalette(parsed.colors);
		if (!Object.keys(colors).length) {
			return null;
		}
		return {
			name: typeof parsed.name === 'string' && parsed.name.trim().length ? parsed.name.trim() : 'Imported theme',
			colors: colors,
		};
	} catch (e) {
		console.warn('[overlay-appearance] could not parse imported theme', e);
		return null;
	}
};

/**
 * Resolves each contract token's default value by probing the relevant game-mode theme class
 * (each `--ov-*` token feeds the matching `--*` base variable, e.g. `--ov-color-1` -> `--color-1`).
 */
let defaultPaletteCache: OverlayAppearancePalette | null = null;
export const getDefaultOverlayPalette = (): OverlayAppearancePalette => {
	if (defaultPaletteCache) {
		return defaultPaletteCache;
	}
	if (typeof document === 'undefined') {
		defaultPaletteCache = { ...FALLBACK_DEFAULT_PALETTE };
		return defaultPaletteCache;
	}

	const probes = new Map<string, CSSStyleDeclaration>();
	const created: HTMLElement[] = [];
	const getProbe = (className: string): CSSStyleDeclaration => {
		let probe = probes.get(className);
		if (!probe) {
			const el = document.createElement('div');
			el.className = className;
			el.style.display = 'none';
			document.body.appendChild(el);
			created.push(el);
			probe = getComputedStyle(el);
			probes.set(className, probe);
		}
		return probe;
	};

	const result: Record<string, string> = {};
	for (const field of OVERLAY_APPEARANCE_COLOR_CONTRACT) {
		const baseVar = field.key.replace('--ov-', '--');
		const probe = getProbe(overlayAppearanceProbeClassForField(field));
		const value = probe.getPropertyValue(baseVar).trim();
		result[field.key] = value || FALLBACK_DEFAULT_PALETTE[field.key] || '';
	}

	created.forEach((el) => document.body.removeChild(el));

	defaultPaletteCache = result as OverlayAppearancePalette;
	return defaultPaletteCache;
};

/** Defaults used when the document/CSS is not available (e.g. the Electron main process). */
const FALLBACK_DEFAULT_PALETTE: Record<OverlayAppearanceColorKey, string> = {
	'--ov-color-1': '#9fb6d7',
	'--ov-color-2': '#767faf',
	'--ov-color-3': '#5a5f87',
	'--ov-color-4': '#303352',
	'--ov-color-5': '#1f2142',
	'--ov-color-6': '#101530',
	'--ov-color-7': '#07081f',
	'--ov-color-8': '#cb9fd7',
	'--ov-color-9': '#12121f',
	'--ov-color-common-1': '#d9c3ab',
	'--ov-color-common-2': '#ffb948',
	'--ov-default-text-color': '#d9c3ab',
	'--ov-default-title-color': '#ffb948',
	'--ov-secondary-text-color': '#9fb6d7',
	'--ov-bgs-widget-background-color-start': 'rgba(94, 11, 70, 0.7)',
	'--ov-bgs-widget-background-color-end': 'rgba(30, 1, 22, 1)',
};

export const newOverlayThemeId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `theme-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};
