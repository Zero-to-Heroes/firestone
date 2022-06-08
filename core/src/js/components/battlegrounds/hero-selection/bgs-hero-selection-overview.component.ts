import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { AdService } from '../../../services/ad.service';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-hero-selection-overview',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-overview.component.scss`,
	],
	template: `
		<div class="container" [ngClass]="{ 'no-ads': !showAds }">
			<div class="left">
				<battlegrounds-tier-list [showFilters]="true"></battlegrounds-tier-list>
			</div>
			<div class="hero-selection-overview">
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
	tiers$: Observable<readonly { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }[]>;
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;

	showAds = true;

	constructor(
		private readonly ads: AdService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.tiers$ = this.store.bgHeroStats$().pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => this.buildTiers(stats)),
		);

		this.heroOverviews$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		).pipe(
			this.mapData(([stats, [achievements], [panels, showAchievements]]) => {
				// console.debug('selection info', stats, achievements, panels, showAchievements);
				const panel = panels.find(
					(panel) => panel.id === 'bgs-hero-selection-overview',
				) as BgsHeroSelectionOverviewPanel;
				const heroesAchievementCategory = achievements.findCategory('hearthstone_game_sub_13');
				// console.debug('panel & category', panel, heroesAchievementCategory);
				if (!panel || !heroesAchievementCategory) {
					return [];
				}

				const selectionOptions =
					panel?.heroOptionCardIds ?? (panel.selectedHeroCardId ? [panel.selectedHeroCardId] : null);
				// console.debug('selectionOptions', selectionOptions);
				if (!selectionOptions?.length) {
					return [];
				}

				const heroAchievements: readonly VisualAchievement[] = heroesAchievementCategory.retrieveAllAchievements();
				// console.debug('heroAchievements', heroAchievements);
				const heroOverviews = selectionOptions.map((cardId) => {
					const normalized = normalizeHeroCardId(cardId, this.allCards);
					const existingStat = stats?.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat ?? BgsHeroStat.create({ id: normalized } as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					// console.debug('achievements for hero', achievementsForHero);
					return {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						achievements: achievementsForHero,
						combatWinrate: statWithDefault.combatWinrate?.slice(0, 15) ?? [],
					};
				});
				if (heroOverviews.length === 2) {
					return [null, ...heroOverviews, null];
				} else if (heroOverviews.length === 3) {
					return [...heroOverviews, null];
				} else {
					return heroOverviews;
				}
			}),
		);

		this.init();
	}

	private buildTiers(
		stats: readonly BgsHeroStat[],
	): readonly { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }[] {
		const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
		const groupedByTier: (readonly BgsHeroStat[])[] = Object.values(groupingByTier(stats));
		return [
			{
				tier: 'S' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'S')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
			{
				tier: 'A' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'A')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
			{
				tier: 'B' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'B')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
			{
				tier: 'C' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'C')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
			{
				tier: 'D' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'D')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
			{
				tier: 'E' as BgsHeroTier,
				heroes: [...(groupedByTier.find((heroes) => heroes.find((hero) => hero.tier === 'E')) ?? [])].sort(
					(a, b) => a.averagePosition - b.averagePosition,
				),
			},
		].filter((tier) => tier.heroes);
	}

	getOverviewWidth(): number {
		return 24;
	}

	trackByTierFn(index, item: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }) {
		return item.tier;
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}

	private async init() {
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
}
