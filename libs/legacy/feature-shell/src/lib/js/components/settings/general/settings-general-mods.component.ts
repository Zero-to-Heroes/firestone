import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { OverwolfService } from '@legacy-import/src/lib/js/services/overwolf.service';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { ModData, ModsManagerService } from '@legacy-import/src/lib/libs/mods/services/mods-manager.service';
import { ModsUtilsService } from '@legacy-import/src/lib/libs/mods/services/mods-utils.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, filter, Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
				<div
					class="mods-install-status"
					*ngIf="modsInstallStatus$ | async as status"
					[owTranslate]="status"
				></div>
				<div class="button-group" [ngClass]="{ pending: installOngoing }">
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
					<div class="mod" *ngFor="let mod of installedMods; trackBy: trackByMod">
						<div class="mod-name">{{ mod.Name }}</div>
						<toggle-view
							class="toggle-button"
							[value]="mod.Registered"
							[toggleFunction]="toggleMod(mod.AssemblyName)"
						></toggle-view>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: add more feedback on what is happening
export class SettingsGeneralModsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	modsInstallStatus$: Observable<string>;

	gameLocation: string;
	status: string;
	showGameRunningError: boolean;

	installOngoing: boolean;
	modsChecked: boolean;
	areModsInstalled: boolean;
	installedMods: readonly ModData[] = [];

	linkTitle = this.i18n.translateString('settings.general.mods.instructions-link');
	instructions = this.i18n.translateString('settings.general.mods.instructions', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">${this.linkTitle}</a>`,
	});
	addModsDescriptions = this.i18n.translateString('settings.general.mods.add-mods-description', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">${this.linkTitle}</a>`,
	});

	private modsManager: ModsManagerService;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly modUtils: ModsUtilsService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.modsManager = this.ow.getMainWindow().modsManager;
		combineLatest([this.listenForBasicPref$((prefs) => prefs.mods), this.modsManager.modsData$$.asObservable()])
			.pipe(
				filter(([modsPrefs, modsData]) => !!modsData?.length),
				this.mapData(([modsPrefs, modsData]) => ({ modsPrefs, modsData })),
			)
			.subscribe(async ({ modsPrefs, modsData }) => {
				this.installedMods = modsData;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.modsInstallStatus$ = this.modUtils.currentModsStatus$$
			.asObservable()
			.pipe(this.mapData((status) => status));
	}

	async ngAfterViewInit() {
		const prefs = await this.prefs.getPreferences();
		this.gameLocation = prefs.gameInstallPath;
		if (this.gameLocation) {
			await this.checkMods();
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async checkMods() {
		console.debug('checking mods', this.gameLocation);
		const checkStatus = await this.modUtils.checkMods(this.gameLocation);
		if (checkStatus !== 'wrong-path') {
			this.modsChecked = true;
		}
		this.areModsInstalled = checkStatus === 'installed';
		if (this.areModsInstalled) {
			this.installedMods = await this.modUtils.installedMods(this.gameLocation);
			console.debug('installedMods', this.installedMods);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async enableMods() {
		this.installOngoing = true;
		console.debug('enabling mods');
		const status = await this.modUtils.enableMods(this.gameLocation);
		if (status === 'game-running') {
			this.showGameRunningError = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		this.areModsInstalled = status === 'installed';
		this.installOngoing = false;
		this.installedMods = await this.modUtils.installedMods(this.gameLocation);
		console.debug('installedMods 2', this.installedMods);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async refreshEngine() {
		console.debug('refreshing engine');
		const status = await this.modUtils.refreshEngine(this.gameLocation);
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

	toggleMod(modName) {
		return async (_: boolean) => {
			const prefs = await this.prefs.getPreferences();
			// const modNameForPrefs = modName.replace(/ /g, '');
			const existingToggle = prefs.mods[modName] ?? true;
			const newToggle = !existingToggle;
			const newPrefs: Preferences = { ...prefs, mods: { ...prefs.mods, [modName]: newToggle } };
			// Make sure the prefs are saved first, so that we can use the pref value in the callback
			await this.prefs.savePreferences(newPrefs);
			await this.modsManager.toggleMods([modName]);
		};
	}

	trackByMod(index: number, item: ModData): string {
		// console.debug('tracking mod', index, item);
		return item.Name;
	}

	async disableMods() {
		console.debug('disabling mods');
		const status = await this.modUtils.disableMods(this.gameLocation);
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
