/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	CardsFacadeService,
	DiskCacheService,
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
			<nav class="navigation" *ngIf="rootNode">
				<div class="header" [fsTranslate]="'settings.title'"></div>
				<settings-search class="search"></settings-search>
				<ul class="nodes">
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

	rootNode: SettingNode;

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
		@Inject(ADS_SERVICE_TOKEN) private readonly adService: IAdsService,
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
		const context: SettingContext = {
			allCards: this.allCards,
			prefs: this.prefs,
			analytics: this.analytics,
			ow: this.ow,
			i18n: this.i18n,
			adService: this.adService,
			services: {
				diskCache: this.diskCache,
				gamesLoader: this.gamesLoader,
			},
		};
		this.rootNode = settingsDefinition(context);
		const localeSettings$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => {
				return settingsDefinition(context);
			}),
		);

		combineLatest([localeSettings$, this.controller.searchString$$]).subscribe(
			([settingsDefinition, searchString]) => {
				const selectedNodeId = this.controller.selectedNode$$.value?.id;
				const filteredSettings = filterSettings(settingsDefinition, searchString);
				const newSelectedNode = findNode(filteredSettings, selectedNodeId);
				this.rootNode = filteredSettings;
				this.controller.selectedNode$$.next(newSelectedNode);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			},
		);

		if (!this.controller.selectedNode$$.value) {
			this.controller.selectedNode$$.next(this.rootNode.children![0].children![0]);
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
