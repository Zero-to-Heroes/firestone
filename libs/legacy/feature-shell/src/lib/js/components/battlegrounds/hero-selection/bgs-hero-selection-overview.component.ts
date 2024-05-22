import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { isBattlegroundsDuo } from '@firestone-hs/reference-data';
import {
	BgsHeroSelectionOverviewPanel,
	BgsPlayerHeroStatsService,
	BgsStateFacadeService,
	Config,
} from '@firestone/battlegrounds/common';
import { BgsHeroTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { VisualAchievement } from '../../../models/visual-achievement';
import { findCategory } from '../../../services/achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../services/achievement/achievements-state-manager.service';
import { AdService } from '../../../services/ad.service';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-hero-selection-overview',
	styleUrls: [`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-overview.component.scss`],
	template: `
		<div class="container">
			<div class="left" *ngIf="!(showAds$ | async)">
				<battlegrounds-tier-list></battlegrounds-tier-list>
			</div>
			<div class="hero-selection-overview">
				<div class="filters">
					<preference-toggle
						field="bgsActiveUseMmrFilterInHeroSelection"
						[label]="
							'settings.battlegrounds.general.use-mmr-filter-for-live-stats-label-short' | owTranslate
						"
						[tooltip]="'settings.battlegrounds.general.use-mmr-filter-for-live-stats-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsActiveUseTribesFilterInHeroSelection"
						[label]="
							'settings.battlegrounds.general.use-tribes-filter-for-live-stats-label-short' | owTranslate
						"
						[tooltip]="
							'settings.battlegrounds.general.use-tribes-filter-for-live-stats-tooltip' | owTranslate
						"
					></preference-toggle>
					<!-- <preference-toggle
						field="bgsActiveUseAnomalyFilterInHeroSelection"
						[label]="
							'settings.battlegrounds.general.use-anomaly-filter-for-live-stats-label-short' | owTranslate
						"
						[tooltip]="
							'settings.battlegrounds.general.use-anomaly-filter-for-live-stats-tooltip' | owTranslate
						"
					></preference-toggle> -->
				</div>
				<bgs-hero-overview
					*ngFor="let hero of (heroOverviews$ | async) || []; trackBy: trackByHeroFn"
					[hero]="hero"
					[achievements]="hero?.achievements"
					[style.width.%]="getOverviewWidth()"
				></bgs-hero-overview>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly ads: AdService,
		private readonly bgsState: BgsStateFacadeService,
		private readonly gameState: GameStateFacadeService,
		private readonly achievements: AchievementsStateManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(
			this.playerHeroStats,
			this.ads,
			this.bgsState,
			this.prefs,
			this.achievements,
			this.gameState,
		);

		const statsConfigs: Observable<ExtendedConfig> = combineLatest([
			this.gameState.gameState$$,
			this.bgsState.gameState$$,
			this.prefs.preferences$$,
		]).pipe(
			this.mapData(
				([gameState, bgState, prefs]) => {
					const config: ExtendedConfig = {
						gameMode: isBattlegroundsDuo(gameState.metadata.gameType)
							? 'battlegrounds-duo'
							: 'battlegrounds',
						timeFilter: 'last-patch',
						mmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection
							? bgState.currentGame?.mmrAtStart ?? 0
							: null,
						rankFilter: 25,
						tribesFilter: prefs.bgsActiveUseTribesFilterInHeroSelection
							? bgState.currentGame?.availableRaces
							: [],
						anomaliesFilter: bgState.currentGame?.anomalies ?? [],
					};
					return config;
				},
				(a, b) => deepEqual(a, b),
			),
		);
		const tiers$ = statsConfigs.pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			tap((config) => console.debug('[bgs-hero-selection-overview] received config', config)),
			switchMap((config) => this.playerHeroStats.buildFinalStats(config, config.mmrFilter)),
			this.mapData((stats) => buildTiers(stats?.stats, this.i18n)),
		);

		this.showAds$ = this.ads.showAds$$.pipe(this.mapData((showAds) => showAds));

		this.heroOverviews$ = combineLatest([
			tiers$,
			this.achievements.groupedAchievements$$,
			this.bgsState.gameState$$.pipe(
				this.mapData(
					(state) =>
						// Filter here to avoid recomputing achievements info every time something changes in
						// another panel (finding the right panel is inexpensive)
						state.panels?.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
				),
			),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowHeroSelectionAchievements)),
		]).pipe(
			this.mapData(([tiers, achievements, panel, showAchievements]) => {
				const heroesAchievementCategory = findCategory('hearthstone_game_sub_13', achievements);
				if (!panel || !heroesAchievementCategory) {
					return [];
				}

				const selectionOptions =
					panel?.heroOptionCardIds ?? (panel.selectedHeroCardId ? [panel.selectedHeroCardId] : null);
				if (!selectionOptions?.length) {
					return [];
				}

				const heroAchievements: readonly VisualAchievement[] =
					heroesAchievementCategory.retrieveAllAchievements();
				const heroOverviews: readonly InternalBgsHeroStat[] = selectionOptions.map((cardId) => {
					const normalized = normalizeHeroCardId(cardId, this.allCards);
					const tier = tiers.find((t) => t.items.map((i) => i.baseCardId).includes(normalized));
					const existingStat = tier?.items?.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat ?? ({ id: normalized } as BgsMetaHeroStatTierItem);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					return {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						tier: tier?.id,
						achievements: achievementsForHero,
						combatWinrate: statWithDefault.combatWinrate?.slice(0, 15) ?? [],
					};
				});
				console.debug('heroOverviews', heroOverviews, tiers);
				if (heroOverviews.length === 1) {
					return [null, null, ...heroOverviews, null];
				} else if (heroOverviews.length === 2) {
					return [null, ...heroOverviews, null];
				} else if (heroOverviews.length === 3) {
					return [...heroOverviews, null];
				} else {
					return heroOverviews;
				}
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	getOverviewWidth(): number {
		return 24;
	}

	trackByTierFn(index, item: { tier: BgsHeroTier; heroes: readonly BgsMetaHeroStatTierItem[] }) {
		return item.tier;
	}

	trackByHeroFn(index, item: BgsMetaHeroStatTierItem) {
		return item?.id;
	}

	async toggleFilter() {
		// const prefs = await this.prefs.getPreferences();
		// const newPrefs: Preferences = {
		// 	...prefs,
		// 	bgsActiveUseAnomalyFilterInHeroSelection: prefs.bgsSavedUseAnomalyFilterInHeroSelection,
		// 	bgsActiveUseMmrFilterInHeroSelection: prefs.bgsSavedUseMmrFilterInHeroSelection,
		// };
		// await this.prefs.savePreferences(newPrefs);
	}
}

interface InternalBgsHeroStat extends BgsMetaHeroStatTierItem {
	readonly achievements: readonly VisualAchievement[];
	readonly notEnoughDataPoints?: boolean;
}

export interface ExtendedConfig extends Config {
	mmrFilter: number;
}
