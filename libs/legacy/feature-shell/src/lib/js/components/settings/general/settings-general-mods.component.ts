import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { ModConfig, ModsConfig, toModVersion } from '@legacy-import/src/lib/libs/mods/model/mods-config';
import { ModsConfigService } from '@legacy-import/src/lib/libs/mods/services/mods-config.service';
import { ModData, ModsManagerService } from '@legacy-import/src/lib/libs/mods/services/mods-manager.service';
import { ModsUtilsService } from '@legacy-import/src/lib/libs/mods/services/mods-utils.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { filter, Observable, tap } from 'rxjs';
import { Preferences } from '../../../models/preferences';
import { GameStatusService } from '../../../services/game-status.service';
import { PreferencesService } from '../../../services/preferences.service';
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
						[helpTooltip]="'settings.general.mods.refresh-engine-tooltip' | owTranslate"
					>
						{{ refreshEngineTitle }}
					</button>
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

				<button
					class="check-updates-button"
					*ngIf="areModsInstalled && !!installedMods?.length"
					[ngClass]="{ disabled: checkForUpdatesButtonDisabled }"
					(mousedown)="checkForUpdates()"
					[helpTooltip]="'settings.general.mods.check-for-updates-tooltip' | owTranslate"
				>
					{{ checkForUpdatesLabel }}
				</button>

				<div class="installed-mods" *ngIf="{ inGame: inGame$ | async } as value">
					<div class="mod" *ngFor="let mod of installedMods; trackBy: trackByMod">
						<div
							class="update-available"
							*ngIf="!!mod.updateAvailableVersion && !value.inGame"
							inlineSVG="assets/svg/restore.svg"
							[helpTooltip]="'settings.general.mods.update-available' | owTranslate"
							(click)="updateMod(mod)"
						></div>
						<div
							class="update-available disabled"
							*ngIf="!!mod.updateAvailableVersion && value.inGame"
							inlineSVG="assets/svg/restore.svg"
							[helpTooltip]="'settings.general.mods.update-disabled' | owTranslate"
						></div>
						<div class="mod-name" *ngIf="!mod.DownloadLink">{{ mod.Name }}</div>
						<a class="mod-name" *ngIf="mod.DownloadLink" href="{{ mod.DownloadLink }}" target="_blank">{{
							mod.Name
						}}</a>
						<div class="mod-version" *ngIf="mod.Version">v{{ mod.Version }}</div>
						<fs-toggle-view
							class="toggle-button"
							[value]="mod.Registered"
							[toggleFunction]="toggleMod(mod.AssemblyName)"
						></fs-toggle-view>
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
	inGame$: Observable<boolean>;

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

	refreshEngineTitle = this.i18n.translateString('settings.general.mods.refresh-engine');

	checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.check-for-updates');
	checkForUpdatesButtonDisabled: boolean;

	private modsManager: ModsManagerService;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly modUtils: ModsUtilsService,
		private readonly prefs: PreferencesService,
		private readonly modsConfig: ModsConfigService,
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.modsManager = this.ow.getMainWindow().modsManager;

		this.inGame$ = this.gameStatus.inGame$$.asObservable().pipe(
			tap((info) => console.debug('mods in game?', info)),
			this.mapData((info) => info),
		);
		this.modsManager.modsData$$
			.asObservable()
			.pipe(
				filter((modsData) => !!modsData?.length),
				this.mapData((modsData) => modsData),
			)
			.subscribe(async (modsData) => {
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
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, modsEnabled: this.areModsInstalled };
		await this.prefs.savePreferences(newPrefs);
		this.installOngoing = false;
		this.installedMods = await this.modUtils.installedMods(this.gameLocation);
		console.debug('installedMods 2', this.installedMods);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async refreshEngine() {
		console.debug('refreshing engine');
		this.refreshEngineTitle = this.i18n.translateString('settings.general.mods.refreshing-engine');
		// Because otherwise it's too quick and we think nothing happened
		await sleep(500);
		const status = await this.modUtils.refreshEngine(this.gameLocation);
		this.refreshEngineTitle = this.i18n.translateString('settings.general.mods.refresh-engine');
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
			const config: ModsConfig = this.modsConfig.getConfig();
			// const modNameForPrefs = modName.replace(/ /g, '');
			const existingConfigForMod = config[modName] ?? ({} as ModConfig);
			const existingToggle = existingConfigForMod.enabled ?? true;
			const newToggle = !existingToggle;
			const newConf: ModsConfig = {
				...config,
				[modName]: {
					...existingConfigForMod,
					enabled: newToggle,
				},
			};
			console.debug('updating mods conf', newConf, config);
			// Make sure the prefs are saved first, so that we can use the pref value in the callback
			this.modsConfig.updateConf(newConf);
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
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, modsEnabled: this.areModsInstalled };
		await this.prefs.savePreferences(newPrefs);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async checkForUpdates() {
		console.debug('checking for updates');
		this.checkForUpdatesButtonDisabled = true;
		this.checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.checking-for-updates');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const modsWithDownloadLinks = this.installedMods.filter((m) => !!m.DownloadLink);
		console.debug('modsWithDownloadLinks', modsWithDownloadLinks);
		for (const mod of modsWithDownloadLinks) {
			console.debug('considering', mod);
			this.checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.checking-mod-for-updates', {
				modName: mod.Name,
			});
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			const newAvailableVersion = await this.modsManager.hasUpdates(mod);
			console.debug('newAvailableVersion', newAvailableVersion);
			if (!newAvailableVersion) {
				continue;
			}
			const existingConf = this.modsConfig.getConfig();
			const confForMod = existingConf[mod.AssemblyName];
			const newConfForMod: ModConfig = {
				...confForMod,
				updateAvailableVersion: toModVersion(newAvailableVersion),
			};
			const newConf: ModsConfig = {
				...existingConf,
				[mod.AssemblyName]: newConfForMod,
			};
			console.debug('updateConf', newConf);
			this.modsConfig.updateConf(newConf);
		}

		this.checkForUpdatesButtonDisabled = false;
		this.checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.check-for-updates');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async updateMod(mod: ModData): Promise<void> {
		await this.modUtils.updateMod(mod);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
