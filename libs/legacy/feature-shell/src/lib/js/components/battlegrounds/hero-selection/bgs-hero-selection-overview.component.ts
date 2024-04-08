import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import {
	BgsHeroSelectionOverviewPanel,
	BgsPlayerHeroStatsService,
	BgsStateFacadeService,
} from '@firestone/battlegrounds/common';
import { BgsHeroTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, tap } from 'rxjs';
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
						field="bgsSavedUseMmrFilterInHeroSelection"
						[label]="
							'settings.battlegrounds.general.use-mmr-filter-for-live-stats-label-short' | owTranslate
						"
						[tooltip]="'settings.battlegrounds.general.use-mmr-filter-for-live-stats-tooltip' | owTranslate"
						[toggleFunction]="toggleFilter"
					></preference-toggle>
					<preference-toggle
						field="bgsSavedUseAnomalyFilterInHeroSelection"
						[label]="
							'settings.battlegrounds.general.use-anomaly-filter-for-live-stats-label-short' | owTranslate
						"
						[tooltip]="
							'settings.battlegrounds.general.use-anomaly-filter-for-live-stats-tooltip' | owTranslate
						"
						[toggleFunction]="toggleFilter"
					></preference-toggle>
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
		private readonly achievements: AchievementsStateManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.playerHeroStats, this.ads, this.bgsState, this.prefs, this.achievements);

		const tiers$ = this.playerHeroStats.tiersWithPlayerData$$.pipe(
			tap((stats) => console.debug('[bgs-hero-selection-overview] received stats', stats)),
			this.mapData((stats) => buildTiers(stats, this.i18n)),
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
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveUseAnomalyFilterInHeroSelection: prefs.bgsSavedUseAnomalyFilterInHeroSelection,
			bgsActiveUseMmrFilterInHeroSelection: prefs.bgsSavedUseMmrFilterInHeroSelection,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

interface InternalBgsHeroStat extends BgsMetaHeroStatTierItem {
	readonly achievements: readonly VisualAchievement[];
	readonly notEnoughDataPoints?: boolean;
}
