/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { ArenaRewardsService } from '@firestone/arena/common';
import { COLLECTION_PACK_SERVICE_TOKEN, ICollectionPackService } from '@firestone/collection/common';
import { AccountService } from '@firestone/profile/common';
import { SettingContext, SettingNode, SettingsControllerService } from '@firestone/settings/services';
import { DiskCacheService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	CardsFacadeService,
	DATABASE_SERVICE_TOKEN,
	IAdsService,
	IDatabaseService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { combineLatest, Observable } from 'rxjs';
import { findNode, settingsDefinition } from '../models/settings-tree/_settings-definition';
import { filterSettings } from '../services/search';
import { SettingsUiControllerService } from '../services/settings-ui-controller.service';

@Component({
	standalone: false,
	selector: 'settings-root',
	styleUrls: [`../../settings-common.component.scss`, `./settings-root.component.scss`],
	template: `
		<div class="settings-root">
			<div class="header-container">
				<div class="header" [fsTranslate]="'settings.title'" (mousedown)="onHeaderMouseDown()"></div>
				<div class="header-buttons">
					<div class="button close" inlineSVG="assets/svg/close.svg" (click)="close()"></div>
				</div>
			</div>
			<div class="contant-container">
				<nav class="navigation" *ngIf="rootNode$ | async as rootNode">
					<settings-search class="search"></settings-search>
					<ul class="nodes" scrollable>
						<settings-navigation-node
							*ngFor="let child of rootNode.children"
							[node]="child"
							[indentLevel]="0"
						></settings-navigation-node>
					</ul>
					<div class="advanced-settings-container">
						<button class="settings-advanced-toggle" (click)="toggleAdvancedSettings()">
							{{ buttonText$ | async }}
						</button>
					</div>
				</nav>
				<div class="current-section">
					<settings-current-page></settings-current-page>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsRootComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	buttonText$: Observable<string>;
	rootNode$: Observable<SettingNode | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly analytics: AnalyticsService,
		private readonly controller: SettingsControllerService,
		private readonly uiController: SettingsUiControllerService,
		private readonly diskCache: DiskCacheService,
		private readonly gamesLoader: GameStatsLoaderService,
		private readonly arenaRewards: ArenaRewardsService,
		@Inject(DATABASE_SERVICE_TOKEN) private readonly db: IDatabaseService,
		private readonly account: AccountService,
		@Inject(ADS_SERVICE_TOKEN) private readonly adService: IAdsService,
		@Inject(COLLECTION_PACK_SERVICE_TOKEN) private readonly packService: ICollectionPackService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.adService, this.controller, this.gamesLoader, this.account);

		this.buttonText$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) =>
				prefs.advancedModeToggledOn
					? this.i18n.translateString('settings.global.hide-advanced-settings-button')
					: this.i18n.translateString('settings.global.show-advanced-settings-button'),
			),
		);
		this.rootNode$ = this.uiController.rootNode$$.asObservable();

		const context: SettingContext = {
			allCards: this.allCards,
			prefs: this.prefs,
			analytics: this.analytics,
			i18n: this.i18n,
			adService: this.adService,
			services: {
				account: this.account,
				diskCache: this.diskCache,
				db: this.db,
				gamesLoader: this.gamesLoader,
				packService: this.packService,
				arenaRewards: this.arenaRewards,
				settingsController: this.controller,
			},
		};
		this.uiController.setRootNode(settingsDefinition(context));

		const localeSettings$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.locale)),
			this.account.region$$.pipe(this.mapData((info) => info)),
		]).pipe(
			this.mapData(([pref, region]) => {
				return settingsDefinition(context);
			}),
		);
		combineLatest([localeSettings$, this.controller.searchString$$]).subscribe(
			([settingsDefinition, searchString]) => {
				const selectedNodeId = this.controller.selectedNodeId$$.value;
				const filteredSettings = filterSettings(settingsDefinition, searchString);
				const newSelectedNode = findNode(filteredSettings, selectedNodeId);
				this.uiController.setRootNode(filteredSettings);
				this.controller.selectedNodeId$$.next(newSelectedNode?.id ?? null);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.markForCheck();
				}
			},
		);

		if (!this.controller.selectedNodeId$$.value && this.uiController.rootNode$$.value) {
			this.controller.selectedNodeId$$.next(this.uiController.rootNode$$.value.children![0].children![0]!.id);
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	onHeaderMouseDown(): void {
		(window as any)?.electronAPI?.startOverlayDragging?.();
	}

	close(): void {
		(window as any)?.electronAPI?.closeSettingsWindow?.();
	}

	async toggleAdvancedSettings() {
		const prefs = await this.prefs.getPreferences();
		const advancedModeToggledOn = prefs.advancedModeToggledOn;
		const newPrefs: Preferences = { ...prefs, advancedModeToggledOn: !advancedModeToggledOn };
		await this.prefs.savePreferences(newPrefs);
	}
}
