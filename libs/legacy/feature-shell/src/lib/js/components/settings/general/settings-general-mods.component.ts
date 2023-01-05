import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { ModsUtilsService } from '@legacy-import/src/lib/libs/mods/services/mods-utils.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-general-mods',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-mods.component.scss`,
	],
	template: `
		<div class="general-mods" scrollable>
			<h2 class="title" [owTranslate]="'settings.general.mods.title'"></h2>
			<p class="warning" [owTranslate]="'settings.general.mods.warning'"></p>
			<p class="instructions" [innerHTML]="instructions | safe"></p>

			<div class="section">
				<h3 class="section-title" [owTranslate]="'settings.general.mods.check-mods-title'"></h3>
				<p class="description" [owTranslate]="'settings.general.mods.check-mods-description'"></p>
				<div class="button-group">
					<input
						class="game-location"
						[(ngModel)]="gameLocation"
						(mousedown)="preventDrag($event)"
						[placeholder]="'settings.general.mods.game-location-placeholder' | owTranslate"
					/>
					<button (mousedown)="checkMods()" [owTranslate]="'settings.general.mods.check-mods'"></button>
				</div>
			</div>

			<div class="section" [ngClass]="{ disabled: !modsChecked }">
				<h3 class="section-title" [owTranslate]="'settings.general.mods.enable-mods-title'"></h3>
				<p
					class="description"
					[owTranslate]="'settings.general.mods.enable-mods-description'"
					*ngIf="!areModsInstalled"
				></p>
				<p
					class="description"
					[owTranslate]="'settings.general.mods.disable-mods-description'"
					*ngIf="areModsInstalled"
				></p>
				<div
					class="game-running-error"
					[owTranslate]="'settings.general.mods.game-running-error'"
					*ngIf="showGameRunningError"
				></div>
				<div class="button-group">
					<!-- <div class="status" *ngIf="status" [innerHTML]="status | safe"></div> -->
					<button
						*ngIf="!areModsInstalled"
						(mousedown)="enableMods()"
						[owTranslate]="'settings.general.mods.enable-mods'"
					></button>
					<button
						*ngIf="areModsInstalled"
						(mousedown)="refreshEngine()"
						[owTranslate]="'settings.general.mods.refresh-engine'"
						[helpTooltip]="'settings.general.mods.refresh-engine-tooltip' | owTranslate"
					></button>
					<button
						*ngIf="areModsInstalled"
						(mousedown)="disableMods()"
						[owTranslate]="'settings.general.mods.disable-mods'"
					></button>
				</div>
			</div>

			<div class="section" [ngClass]="{ disabled: !modsChecked || !areModsInstalled }">
				<h3 class="section-title" [owTranslate]="'settings.general.mods.add-mods-title'"></h3>
				<p class="description" [innerHTML]="addModsDescriptions | safe"></p>
				<p class="description" [owTranslate]="'settings.general.mods.installed-mods-description'"></p>
				<div class="installed-mods">
					<div class="mod" *ngFor="let mod of installedMods">
						<div class="mod-name">{{ mod }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: add more feedback on what is happening
export class SettingsGeneralModsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	gameLocation: string;
	status: string;
	showGameRunningError: boolean;

	modsChecked: boolean;
	areModsInstalled: boolean;
	installedMods: readonly string[] = [];

	linkTitle = this.i18n.translateString('settings.general.mods.instructions-link');
	instructions = this.i18n.translateString('settings.general.mods.instructions', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">${this.linkTitle}</a>`,
	});
	addModsDescriptions = this.i18n.translateString('settings.general.mods.add-mods-description', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">${this.linkTitle}</a>`,
	});

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly mods: ModsUtilsService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		const prefs = await this.prefs.getPreferences();
		this.gameLocation = prefs.gameInstallPath;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async checkMods() {
		console.debug('checking mods', this.gameLocation);
		const checkStatus = await this.mods.checkMods(this.gameLocation);
		if (checkStatus !== 'wrong-path') {
			this.modsChecked = true;
		}
		this.areModsInstalled = checkStatus === 'installed';
		if (this.areModsInstalled) {
			this.installedMods = await this.mods.installedMods(this.gameLocation);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async enableMods() {
		console.debug('enabling mods');
		const status = await this.mods.enableMods(this.gameLocation);
		if (status === 'game-running') {
			this.showGameRunningError = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		this.areModsInstalled = status === 'installed';
		this.installedMods = await this.mods.installedMods(this.gameLocation);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async refreshEngine() {
		console.debug('refreshing engine');
		const status = await this.mods.refreshEngine(this.gameLocation);
		if (status === 'game-running') {
			this.showGameRunningError = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		this.areModsInstalled = status === 'installed';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async disableMods() {
		console.debug('disabling mods');
		const status = await this.mods.disableMods(this.gameLocation);
		if (status === 'game-running') {
			this.showGameRunningError = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		this.areModsInstalled = status === 'installed';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
