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
import { DiskCacheService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { combineLatest, Observable } from 'rxjs';
import { findNode, settingsDefinition } from '../models/settings-tree/_settings-definition';
import { SettingContext, SettingNode } from '../models/settings.types';
import { filterSettings } from '../services/search';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	selector: 'settings-root',
	styleUrls: [`../../settings-common.component.scss`, `./settings-root.component.scss`],
	template: `
		<div class="settings-root">
			<nav class="navigation" *ngIf="rootNode$ | async as rootNode">
				<div class="header" [fsTranslate]="'settings.title'"></div>
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
		private readonly ow: OverwolfService,
		private readonly controller: SettingsControllerService,
		private readonly diskCache: DiskCacheService,
		private readonly gamesLoader: GameStatsLoaderService,
		private readonly arenaRewards: ArenaRewardsService,
		@Inject(ADS_SERVICE_TOKEN) private readonly adService: IAdsService,
		@Inject(COLLECTION_PACK_SERVICE_TOKEN) private readonly packService: ICollectionPackService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.adService, this.controller, this.gamesLoader);

		this.buttonText$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) =>
				prefs.advancedModeToggledOn
					? this.i18n.translateString('settings.global.hide-advanced-settings-button')
					: this.i18n.translateString('settings.global.show-advanced-settings-button'),
			),
		);
		this.rootNode$ = this.controller.rootNode$$.asObservable();

		const isBeta = await this.ow.isBetaChannel();
		const context: SettingContext = {
			allCards: this.allCards,
			prefs: this.prefs,
			analytics: this.analytics,
			ow: this.ow,
			i18n: this.i18n,
			adService: this.adService,
			isBeta: isBeta,
			services: {
				diskCache: this.diskCache,
				gamesLoader: this.gamesLoader,
				packService: this.packService,
				arenaRewards: this.arenaRewards,
			},
		};
		this.controller.setRootNode(settingsDefinition(context));

		const localeSettings$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.locale),
			this.mapData((prefs) => {
				return settingsDefinition(context);
			}),
		);
		combineLatest([localeSettings$, this.controller.searchString$$]).subscribe(
			([settingsDefinition, searchString]) => {
				const selectedNodeId = this.controller.selectedNodeId$$.value;
				const filteredSettings = filterSettings(settingsDefinition, searchString);
				const newSelectedNode = findNode(filteredSettings, selectedNodeId);
				this.controller.setRootNode(filteredSettings);
				this.controller.selectedNodeId$$.next(newSelectedNode?.id ?? null);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			},
		);

		if (!this.controller.selectedNodeId$$.value && this.controller.rootNode$$.value) {
			this.controller.selectedNodeId$$.next(this.controller.rootNode$$.value.children![0].children![0]!.id);
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async toggleAdvancedSettings() {
		const prefs = await this.prefs.getPreferences();
		const advancedModeToggledOn = prefs.advancedModeToggledOn;
		const newPrefs: Preferences = { ...prefs, advancedModeToggledOn: !advancedModeToggledOn };
		await this.prefs.savePreferences(newPrefs);
	}
}
