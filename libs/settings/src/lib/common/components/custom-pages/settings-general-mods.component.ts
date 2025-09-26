import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ModData, ModsManagerService } from '@firestone/mods/common';
import { GameStatusService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, filter } from 'rxjs';

@Component({
	standalone: false,
	selector: 'settings-general-mods',
	styleUrls: [
		`../scrollbar-settings.scss`,
		`../../../settings-common.component.scss`,
		`./settings-general-mods.component.scss`,
	],
	template: `
		<div class="general-mods" scrollable>
			<h2 class="title" [fsTranslate]="'settings.general.mods.title'"></h2>
			<p class="warning" [fsTranslate]="'settings.general.mods.warning'"></p>
			<p class="instructions" [innerHTML]="instructions | safe"></p>

			<div class="section">
				<h3 class="section-title" [fsTranslate]="'settings.general.mods.check-mods-title'"></h3>
				<p class="description" [fsTranslate]="'settings.general.mods.check-mods-description'"></p>
				<div class="button-group">
					<input
						class="game-location"
						[(ngModel)]="gameLocation"
						(mousedown)="preventDrag($event)"
						[placeholder]="'settings.general.mods.game-location-placeholder' | fsTranslate"
					/>
					<button (mousedown)="checkMods()" [fsTranslate]="'settings.general.mods.check-mods'"></button>
				</div>
			</div>

			<div class="section" [ngClass]="{ disabled: !modsChecked }">
				<h3 class="section-title" [fsTranslate]="'settings.general.mods.enable-mods-title'"></h3>
				<p
					class="description"
					[fsTranslate]="'settings.general.mods.enable-mods-description'"
					*ngIf="!areModsInstalled"
				></p>
				<p
					class="description"
					[fsTranslate]="'settings.general.mods.disable-mods-description'"
					*ngIf="areModsInstalled"
				></p>
				<div
					class="game-running-error"
					[fsTranslate]="'settings.general.mods.game-running-error'"
					*ngIf="showGameRunningError"
				></div>
				<div
					class="mods-install-status"
					*ngIf="modsInstallStatus$ | async as status"
					[fsTranslate]="status"
				></div>
				<div class="button-group" [ngClass]="{ pending: installOngoing }">
					<button
						*ngIf="!areModsInstalled"
						(mousedown)="enableMods()"
						[fsTranslate]="'settings.general.mods.enable-mods'"
					></button>
					<!-- <button
						*ngIf="areModsInstalled"
						(mousedown)="refreshEngine()"
						[helpTooltip]="'settings.general.mods.refresh-engine-tooltip' | fsTranslate"
					>
						{{ refreshEngineTitle }}
					</button> -->
					<button
						*ngIf="areModsInstalled"
						(mousedown)="disableMods()"
						[fsTranslate]="'settings.general.mods.disable-mods'"
					></button>
				</div>
			</div>
			<ng-container *ngIf="{ inGame: inGame$ | async } as value">
				<div class="section" [ngClass]="{ disabled: !modsChecked || !areModsInstalled || value.inGame }">
					<h3 class="section-title" [fsTranslate]="'settings.general.mods.add-mods-title'"></h3>
					<p class="warning" *ngIf="value.inGame" [innerHTML]="needToCloseGameWarning | safe"></p>
					<p class="description" [innerHTML]="addModsDescriptions | safe"></p>
					<p class="description" [innerHTML]="installedModsDescription | safe"></p>

					<button
						class="check-updates-button"
						*ngIf="areModsInstalled && !!installedMods?.length"
						[ngClass]="{ disabled: checkForUpdatesButtonDisabled }"
						(mousedown)="checkForUpdates()"
						[helpTooltip]="'settings.general.mods.check-for-updates-tooltip' | fsTranslate"
					>
						{{ checkForUpdatesLabel }}
					</button>

					<div class="installed-mods">
						<div class="mod" *ngFor="let mod of installedMods; trackBy: trackByMod">
							<div
								class="update-available"
								*ngIf="!!mod.updateAvailableVersion"
								inlineSVG="assets/svg/restore.svg"
								[helpTooltip]="'settings.general.mods.update-available' | fsTranslate"
								(click)="updateMod(mod)"
							></div>
							<div class="mod-name" *ngIf="!mod.DownloadLink">{{ mod.Name }}</div>
							<a
								class="mod-name"
								*ngIf="mod.DownloadLink"
								href="{{ mod.DownloadLink }}"
								target="_blank"
								>{{ mod.Name }}</a
							>
							<div class="mod-version" *ngIf="mod.Version">v{{ mod.Version }}</div>
							<fs-toggle-view
								class="toggle-button"
								[value]="mod.Registered"
								[toggleFunction]="toggleMod(mod.AssemblyName)"
							></fs-toggle-view>
						</div>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: add more feedback on what is happening
export class SettingsGeneralModsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	modsInstallStatus$: Observable<string | null>;
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
	installedModsDescription = this.i18n.translateString('settings.general.mods.installed-mods-description-2', {
		path: 'BepInEx/plugins',
	});
	needToCloseGameWarning = this.i18n.translateString('settings.general.mods.need-to-close-game-warning');

	refreshEngineTitle = this.i18n.translateString('settings.general.mods.refresh-engine');

	checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.check-for-updates');
	checkForUpdatesButtonDisabled: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly gameStatus: GameStatusService,
		// private readonly modsConfig: ModsConfigService,
		private readonly modsManager: ModsManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.modsManager, this.gameStatus, this.prefs);

		this.inGame$ = this.gameStatus.inGame$$.asObservable().pipe(this.mapData((info) => info ?? false));
		this.modsManager.modsData$$
			.asObservable()
			.pipe(
				filter((modsData) => !!modsData?.length),
				this.mapData((modsData) => modsData),
			)
			.subscribe(async (modsData) => {
				this.installedMods = modsData.filter((mod) => !!mod);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.modsInstallStatus$ = this.modsManager.currentModsStatus$$
			.asObservable()
			.pipe(this.mapData((status) => status));

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
		const checkStatus = await this.modsManager.checkMods(this.gameLocation);
		if (checkStatus !== 'wrong-path') {
			this.modsChecked = true;
		}
		this.areModsInstalled = checkStatus === 'installed';
		if (this.areModsInstalled) {
			this.installedMods = await this.modsManager.installedMods(this.gameLocation);
			console.debug('installedMods', this.installedMods);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async enableMods() {
		this.installOngoing = true;
		console.debug('enabling mods');
		const status = await this.modsManager.enableMods(this.gameLocation);
		if (status === 'game-running') {
			this.showGameRunningError = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}
		this.areModsInstalled = status === 'installed';
		await this.prefs.updatePrefs('modsEnabled', this.areModsInstalled);
		this.installOngoing = false;
		this.installedMods = await this.modsManager.installedMods(this.gameLocation);
		console.debug('installedMods 2', this.installedMods);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	// async refreshEngine() {
	// 	console.debug('refreshing engine');
	// 	this.refreshEngineTitle = this.i18n.translateString('settings.general.mods.refreshing-engine');
	// 	// Because otherwise it's too quick and we think nothing happened
	// 	await sleep(1000);
	// 	const status = await this.modsManager.refreshEngine(this.gameLocation);
	// 	this.refreshEngineTitle = this.i18n.translateString('settings.general.mods.refresh-engine');
	// 	if (status === 'game-running') {
	// 		this.showGameRunningError = true;
	// 		if (!(this.cdr as ViewRef)?.destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
	// 		return;
	// 	}
	// 	this.areModsInstalled = status === 'installed';
	// 	if (!(this.cdr as ViewRef)?.destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	toggleMod(modName) {
		return async (_: boolean) => {
			this.modsManager.toggleMods([modName]);
		};
	}

	trackByMod(index: number, item: ModData): string {
		// console.debug('tracking mod', index, item);
		return item.Name;
	}

	async disableMods() {
		console.debug('disabling mods');
		const status = await this.modsManager.disableMods(this.gameLocation);
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
			this.checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.checking-mod-for-updates', {
				modName: mod.Name,
			});
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			const newAvailableVersion = await this.modsManager.hasUpdates(mod);
			console.debug('newAvailableVersion', newAvailableVersion);
		}

		this.checkForUpdatesButtonDisabled = false;
		this.checkForUpdatesLabel = this.i18n.translateString('settings.general.mods.check-for-updates');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async updateMod(mod: ModData): Promise<void> {
		await this.modsManager.updateMod(mod);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
