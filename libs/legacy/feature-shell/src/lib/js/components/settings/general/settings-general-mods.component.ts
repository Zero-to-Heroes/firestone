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
		<div class="general-mods">
			<div class="title" [owTranslate]="'settings.general.mods.title'"></div>

			<div class="button-group">
				<!-- Use OW folderPicker here -->
				<input
					class="game-location"
					[(ngModel)]="gameLocation"
					(mousedown)="preventDrag($event)"
					[placeholder]="'settings.general.mods.game-location-placeholder' | owTranslate"
				/>
				<button (mousedown)="checkMods()" [owTranslate]="'settings.general.mods.check-mods'"></button>
			</div>

			<div class="button-group">
				<div class="status" *ngIf="status" [innerHTML]="status | safe"></div>
				<button
					*ngIf="!modsInstalled"
					(mousedown)="enableMods()"
					[owTranslate]="'settings.general.mods.enable-mods'"
				></button>
				<button
					*ngIf="modsInstalled"
					(mousedown)="disableMods()"
					[owTranslate]="'settings.general.mods.disable-mods'"
				></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralModsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	gameLocation: string;
	status: string;
	modsInstalled: boolean;

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
		this.modsInstalled = await this.mods.checkMods(this.gameLocation);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	enableMods() {
		console.debug('enabling mods');
		this.mods.enableMods(this.gameLocation);
	}

	disableMods() {
		console.debug('disabling mods');
		this.mods.disableMods(this.gameLocation);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
