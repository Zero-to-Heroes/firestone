/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { OverlayAppearanceService, SavedOverlayTheme } from '@firestone/settings/services';
import {
	BUILTIN_OVERLAY_APPEARANCE_THEMES,
	OVERLAY_APPEARANCE_COLOR_CONTRACT,
	OverlayAppearanceThemeSelection,
	PreferencesService,
	usesCustomPalette,
} from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'appearance-customization',
	styleUrls: [`../../../settings-common.component.scss`, `./appearance-customization.component.scss`],
	template: `
		<div class="overlay-theme-settings">
			<div class="title" [fsTranslate]="'settings.general.appearance.overlay-theme.title'"></div>
			<div class="text" [fsTranslate]="'settings.general.appearance.overlay-theme.intro'"></div>

			<div class="theme-selector">
				<div class="label" [fsTranslate]="'settings.general.appearance.overlay-theme.selector-label'"></div>
				<filter-dropdown
					class="theme-dropdown"
					[options]="themeOptions$ | async"
					[filter]="(currentSelection$ | async) ?? 'firestone'"
					[visible]="true"
					[placeholder]="'settings.general.appearance.overlay-theme.firestone' | fsTranslate"
					(onOptionSelected)="onThemeSelected($event)"
				></filter-dropdown>
			</div>

			<ng-container *ngIf="showEditor$ | async; else builtinHint">
				<div class="settings-group general-colors">
					<div
						class="subtitle"
						[fsTranslate]="'settings.general.appearance.overlay-theme.group.general'"
					></div>
					<custom-color-picker
						*ngFor="let field of generalFields"
						[label]="field.labelKey | fsTranslate"
						[key]="field.key"
					></custom-color-picker>
				</div>
				<div class="settings-group battlegrounds-colors">
					<div
						class="subtitle"
						[fsTranslate]="'settings.general.appearance.overlay-theme.group.battlegrounds'"
					></div>
					<custom-color-picker
						*ngFor="let field of battlegroundsFields"
						[label]="field.labelKey | fsTranslate"
						[key]="field.key"
					></custom-color-picker>
				</div>

				<div class="save-theme">
					<input
						class="theme-name-input"
						type="text"
						[(ngModel)]="newThemeName"
						[placeholder]="'settings.general.appearance.overlay-theme.name-placeholder' | fsTranslate"
					/>
					<button
						class="button save-button"
						[fsTranslate]="'settings.general.appearance.overlay-theme.save-button'"
						(click)="saveAsNewTheme()"
					></button>
					<button
						class="button reset-button"
						[fsTranslate]="'settings.general.appearance.overlay-theme.reset-button'"
						(click)="resetCustom()"
					></button>
					<button
						class="button export-button"
						[fsTranslate]="'settings.general.appearance.overlay-theme.export-current-button'"
						(click)="exportCurrent()"
					></button>
				</div>
			</ng-container>
			<ng-template #builtinHint>
				<div class="builtin-hint">
					<div class="text" [fsTranslate]="'settings.general.appearance.overlay-theme.builtin-hint'"></div>
					<button
						class="button customize-button"
						[fsTranslate]="'settings.general.appearance.overlay-theme.customize-button'"
						(click)="startCustomizing()"
					></button>
				</div>
			</ng-template>

			<div class="saved-themes" *ngIf="(savedThemes$ | async)?.length">
				<div class="subtitle" [fsTranslate]="'settings.general.appearance.overlay-theme.saved-themes'"></div>
				<div class="saved-theme" *ngFor="let theme of savedThemes$ | async">
					<div class="theme-name">{{ theme.name }}</div>
					<div class="theme-actions">
						<button
							class="button"
							[fsTranslate]="'settings.general.appearance.overlay-theme.apply-button'"
							(click)="applyTheme(theme)"
						></button>
						<button
							class="button"
							[fsTranslate]="'settings.general.appearance.overlay-theme.edit-button'"
							(click)="editTheme(theme)"
						></button>
						<button
							class="button"
							[fsTranslate]="'settings.general.appearance.overlay-theme.export-button'"
							(click)="exportTheme(theme)"
						></button>
						<button
							class="button delete-button"
							[fsTranslate]="'settings.general.appearance.overlay-theme.delete-button'"
							(click)="deleteTheme(theme)"
						></button>
					</div>
				</div>
			</div>

			<div class="import-export">
				<button
					class="button import-button"
					[fsTranslate]="'settings.general.appearance.overlay-theme.import-button'"
					(click)="triggerImport()"
				></button>
				<input
					#fileInput
					class="hidden-file-input"
					type="file"
					accept="application/json,.json"
					(change)="onFileSelected($event)"
				/>
				<div class="error" *ngIf="importError" [fsTranslate]="importError"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceCustomizationPageComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;

	readonly generalFields = OVERLAY_APPEARANCE_COLOR_CONTRACT.filter((field) => field.gameMode !== 'battlegrounds');
	readonly battlegroundsFields = OVERLAY_APPEARANCE_COLOR_CONTRACT.filter(
		(field) => field.gameMode === 'battlegrounds',
	);

	themeOptions$: Observable<readonly IOption[]>;
	currentSelection$: Observable<OverlayAppearanceThemeSelection>;
	showEditor$: Observable<boolean>;
	savedThemes$: Observable<readonly SavedOverlayTheme[]>;

	newThemeName = '';
	importError: string | null = null;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly appearance: OverlayAppearanceService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.appearance, this.prefs);

		this.currentSelection$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.overlayAppearanceTheme ?? 'firestone'),
		);
		this.showEditor$ = this.currentSelection$.pipe(this.mapData((selection) => usesCustomPalette(selection)));
		this.savedThemes$ = this.appearance.savedThemes$$.pipe(this.mapData((themes) => themes ?? []));

		const builtinOptions: readonly IOption[] = BUILTIN_OVERLAY_APPEARANCE_THEMES.map((theme) => ({
			value: theme.id,
			label: this.i18n.translateString(theme.labelKey),
		}));
		this.themeOptions$ = this.savedThemes$.pipe(
			this.mapData((themes) => [
				...builtinOptions,
				...themes.map((theme) => ({ value: `user:${theme.id}`, label: theme.name })),
			]),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	onThemeSelected(option: IOption) {
		void this.prefs.updatePrefs('overlayAppearanceTheme', option.value as OverlayAppearanceThemeSelection);
	}

	startCustomizing() {
		void this.prefs.updatePrefs('overlayAppearanceTheme', 'custom');
	}

	resetCustom() {
		this.appearance.resetCustomPalette();
	}

	async saveAsNewTheme() {
		await this.appearance.saveCurrentPaletteAsTheme(this.newThemeName);
		this.newThemeName = '';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	async exportCurrent() {
		const name = this.newThemeName?.trim().length ? this.newThemeName.trim() : 'firestone-overlay-theme';
		const json = await this.appearance.exportCurrentPalette(name);
		this.downloadJson(name, json);
	}

	applyTheme(theme: SavedOverlayTheme) {
		void this.prefs.updatePrefs('overlayAppearanceTheme', `user:${theme.id}`);
	}

	async editTheme(theme: SavedOverlayTheme) {
		await this.appearance.editThemeAsCustom(theme.id);
	}

	async exportTheme(theme: SavedOverlayTheme) {
		const json = await this.appearance.exportTheme(theme.id);
		if (json) {
			this.downloadJson(theme.name, json);
		}
	}

	deleteTheme(theme: SavedOverlayTheme) {
		this.appearance.deleteTheme(theme.id);
	}

	triggerImport() {
		this.importError = null;
		this.fileInput?.nativeElement?.click();
	}

	async onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}
		const text = await file.text();
		input.value = '';
		const imported = await this.appearance.importTheme(text);
		this.importError = imported ? null : 'settings.general.appearance.overlay-theme.import-error';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	private downloadJson(name: string, content: string) {
		if (typeof document === 'undefined') {
			return;
		}
		const safeName = (name || 'firestone-overlay-theme').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
		const blob = new Blob([content], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${safeName}.firestone-theme.json`;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
}
