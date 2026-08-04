/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import {
	OVERLAY_APPEARANCE_COLOR_KEYS,
	OverlayAppearanceColorKey,
	OverlayAppearancePalette,
	OverlayAppearanceThemeSelection,
	PreferencesService,
	getUserOverlayThemeId,
	isUserOverlayTheme,
} from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import {
	ParsedOverlayTheme,
	SavedOverlayTheme,
	exportOverlayThemeToJson,
	newOverlayThemeId,
	parseImportedOverlayTheme,
	sanitizePalette,
} from '../models/overlay-appearance';

const paletteEventName = 'overlay-appearance-palette';
const savedThemesEventName = 'overlay-appearance-saved-themes';

/**
 * Manages the look & feel of the in-game overlays.
 *
 * Builtin themes are pure SCSS (applied through the `data-overlay-appearance` attribute set by
 * the OverlayAppearanceThemeDirective). This service owns the *dynamic* part: the editable custom
 * palette and the user-saved themes. When the active theme is `custom` or a user theme, it writes
 * the `--ov-*` tokens inline onto the overlay host via {@link register}.
 */
@Injectable()
export class OverlayAppearanceService extends AbstractFacadeService<OverlayAppearanceService> {
	/** The editable custom palette (only the tokens the user has overridden). */
	public customPalette$$: SubscriberAwareBehaviorSubject<OverlayAppearancePalette>;
	public savedThemes$$: SubscriberAwareBehaviorSubject<readonly SavedOverlayTheme[]>;

	private localStorage: LocalStorageService;
	private prefs: PreferencesService;
	private internalSubject$$: SubscriberAwareBehaviorSubject<null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'OverlayAppearanceService', () => !!this.customPalette$$);
	}

	protected override assignSubjects() {
		this.customPalette$$ = this.mainInstance.customPalette$$;
		this.savedThemes$$ = this.mainInstance.savedThemes$$;
	}

	protected async init() {
		this.internalSubject$$ = new SubscriberAwareBehaviorSubject<null>(null);
		this.customPalette$$ = new SubscriberAwareBehaviorSubject<OverlayAppearancePalette>({});
		this.savedThemes$$ = new SubscriberAwareBehaviorSubject<readonly SavedOverlayTheme[]>([]);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.prefs = AppInjector.get(PreferencesService);

		this.customPalette$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.savedThemes$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});

		this.internalSubject$$.onFirstSubscribe(() => {
			const localPalette =
				this.localStorage.getItem<OverlayAppearancePalette>(
					LocalStorageService.LOCAL_STORAGE_OVERLAY_CUSTOM_PALETTE,
				) ?? {};
			this.customPalette$$.next(sanitizePalette(localPalette));

			const localThemes =
				this.localStorage.getItem<readonly SavedOverlayTheme[]>(
					LocalStorageService.LOCAL_STORAGE_OVERLAY_USER_THEMES,
				) ?? [];
			this.savedThemes$$.next(Array.isArray(localThemes) ? localThemes : []);

			this.customPalette$$.subscribe((palette) => {
				this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_OVERLAY_CUSTOM_PALETTE, palette);
			});
			this.savedThemes$$.subscribe((themes) => {
				this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_OVERLAY_USER_THEMES, themes);
			});
		});
	}

	/**
	 * Applies the active theme's dynamic palette to the given overlay host element (the element that
	 * also carries the game-mode theme class and the `data-overlay-appearance` attribute).
	 * For builtin SCSS themes, the inline `--ov-*` tokens are cleared so the SCSS theme takes over.
	 */
	public register(hostElement: HTMLElement) {
		if (!hostElement) {
			return;
		}
		// Renderer Electron proxies never run init(), so prefs is unset there — resolve lazily.
		const prefs = this.prefs ?? AppInjector.get(PreferencesService);
		combineLatest([
			prefs.preferences$$.pipe(
				map((p) => p.overlayAppearanceTheme),
				distinctUntilChanged(),
			),
			this.customPalette$$,
			this.savedThemes$$,
		]).subscribe(([selection, customPalette, savedThemes]) => {
			const palette = this.resolvePalette(selection, customPalette, savedThemes);
			for (const key of OVERLAY_APPEARANCE_COLOR_KEYS) {
				hostElement.style.removeProperty(key);
			}
			if (palette) {
				for (const [key, value] of Object.entries(palette)) {
					if (value) {
						hostElement.style.setProperty(key, value);
					}
				}
			}
		});
	}

	private resolvePalette(
		selection: OverlayAppearanceThemeSelection,
		customPalette: OverlayAppearancePalette,
		savedThemes: readonly SavedOverlayTheme[],
	): OverlayAppearancePalette | null {
		if (selection === 'custom') {
			return customPalette;
		}
		if (isUserOverlayTheme(selection)) {
			const id = getUserOverlayThemeId(selection);
			return savedThemes.find((theme) => theme.id === id)?.colors ?? null;
		}
		return null;
	}

	// --- Custom palette editing ---------------------------------------------------------------

	public setColor(key: OverlayAppearanceColorKey, value: string) {
		void this.callOnMainProcess('setColorInternal', key, value);
	}

	public resetCustomPalette() {
		void this.callOnMainProcess('resetCustomPaletteInternal');
	}

	public setCustomPalette(palette: OverlayAppearancePalette) {
		void this.callOnMainProcess('setCustomPaletteInternal', palette);
	}

	// --- User themes --------------------------------------------------------------------------

	/** Saves the current custom palette as a new named theme and selects it. Returns the new theme. */
	public async saveCurrentPaletteAsTheme(name: string): Promise<SavedOverlayTheme> {
		const palette = sanitizePalette(await this.customPalette$$.getValueWithInit());
		const theme: SavedOverlayTheme = {
			id: newOverlayThemeId(),
			name: name?.trim().length ? name.trim() : 'My theme',
			colors: palette,
			updatedAt: Date.now(),
		};
		await this.callOnMainProcess('addSavedThemeInternal', theme);
		await this.prefs.updatePrefs('overlayAppearanceTheme', `user:${theme.id}`);
		return theme;
	}

	public deleteTheme(id: string) {
		void this.callOnMainProcess('deleteSavedThemeInternal', id);
	}

	/** Loads a saved theme's colors into the editable custom palette and switches to the custom theme. */
	public async editThemeAsCustom(id: string): Promise<void> {
		const theme = (await this.savedThemes$$.getValueWithInit())?.find((t) => t.id === id);
		if (!theme) {
			return;
		}
		this.setCustomPalette(theme.colors);
		await this.prefs.updatePrefs('overlayAppearanceTheme', 'custom');
	}

	public async exportTheme(id: string): Promise<string | null> {
		const theme = (await this.savedThemes$$.getValueWithInit())?.find((t) => t.id === id);
		if (!theme) {
			return null;
		}
		return exportOverlayThemeToJson(theme.name, theme.colors);
	}

	public async exportCurrentPalette(name: string): Promise<string> {
		const palette = sanitizePalette(await this.customPalette$$.getValueWithInit());
		return exportOverlayThemeToJson(name?.trim().length ? name.trim() : 'My theme', palette);
	}

	/** Imports a theme JSON, saves it, selects it and returns it (or null if the JSON is invalid). */
	public async importTheme(json: string): Promise<SavedOverlayTheme | null> {
		const parsed: ParsedOverlayTheme | null = parseImportedOverlayTheme(json);
		if (!parsed) {
			return null;
		}
		const theme: SavedOverlayTheme = {
			id: newOverlayThemeId(),
			name: parsed.name,
			colors: parsed.colors,
			updatedAt: Date.now(),
		};
		await this.callOnMainProcess('addSavedThemeInternal', theme);
		await this.prefs.updatePrefs('overlayAppearanceTheme', `user:${theme.id}`);
		return theme;
	}

	// --- Electron plumbing --------------------------------------------------------------------

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.customPalette$$, paletteEventName);
		this.setupElectronSubject(this.savedThemes$$, savedThemesEventName);
	}

	protected override createElectronProxy(): void | Promise<void> {
		this.customPalette$$ = new SubscriberAwareBehaviorSubject<OverlayAppearancePalette>({});
		this.savedThemes$$ = new SubscriberAwareBehaviorSubject<readonly SavedOverlayTheme[]>([]);
		// Needed by register() / theme helpers that run in the renderer (not via IPC).
		this.prefs = AppInjector.get(PreferencesService);
		this.localStorage = AppInjector.get(LocalStorageService);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('setColorInternal', (key: OverlayAppearanceColorKey, value: string) =>
			this.setColorInternal(key, value),
		);
		this.registerMainProcessMethod('resetCustomPaletteInternal', () => this.resetCustomPaletteInternal());
		this.registerMainProcessMethod('setCustomPaletteInternal', (palette: OverlayAppearancePalette) =>
			this.setCustomPaletteInternal(palette),
		);
		this.registerMainProcessMethod('addSavedThemeInternal', (theme: SavedOverlayTheme) =>
			this.addSavedThemeInternal(theme),
		);
		this.registerMainProcessMethod('deleteSavedThemeInternal', (id: string) => this.deleteSavedThemeInternal(id));
	}

	private setColorInternal(key: OverlayAppearanceColorKey, value: string) {
		const current = this.customPalette$$.value ?? {};
		this.customPalette$$.next(sanitizePalette({ ...current, [key]: value }));
	}

	private resetCustomPaletteInternal() {
		this.customPalette$$.next({});
	}

	private setCustomPaletteInternal(palette: OverlayAppearancePalette) {
		this.customPalette$$.next(sanitizePalette(palette));
	}

	private addSavedThemeInternal(theme: SavedOverlayTheme) {
		const current = this.savedThemes$$.value ?? [];
		const withoutDuplicate = current.filter((t) => t.id !== theme.id);
		this.savedThemes$$.next([...withoutDuplicate, theme]);
	}

	private deleteSavedThemeInternal(id: string) {
		const current = this.savedThemes$$.value ?? [];
		this.savedThemes$$.next(current.filter((t) => t.id !== id));
	}
}
