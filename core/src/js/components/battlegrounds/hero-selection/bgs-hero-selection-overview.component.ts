import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../models/visual-achievement-category';
import { AdService } from '../../../services/ad.service';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';
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
				<battlegrounds-tier-list></battlegrounds-tier-list>
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
export class BgsHeroSelectionOverviewComponent extends AbstractSubscriptionComponent {
	tiers$: Observable<readonly { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }[]>;
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;

	showAds = true;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ads: AdService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
		this.tiers$ = this.store.bgHeroStats$().pipe(
			filter((stats) => !!stats),
			map((stats) => this.buildTiers(stats)),
			tap((info) => cdLog('emitting tiers in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
		this.heroOverviews$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		).pipe(
			// tap((info) => console.debug('info in hero selection', info)),
			map(
				([stats, [achievements], [panels, showAchievements]]) =>
					[
						panels.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
						achievements.findCategory('hearthstone_game_sub_13'),
						stats,
						showAchievements,
					] as [BgsHeroSelectionOverviewPanel, VisualAchievementCategory, readonly BgsHeroStat[], boolean],
			),
			filter(
				([panel, heroesAchievementCategory, stats, showAchievements]) =>
					!!panel && !!heroesAchievementCategory && !!stats?.length,
			),
			map(
				([panel, heroesAchievementCategory, stats, showAchievements]) =>
					[
						panel?.heroOptionCardIds ?? (panel.selectedHeroCardId ? [panel.selectedHeroCardId] : null),
						heroesAchievementCategory,
						stats,
						showAchievements,
					] as [readonly string[], VisualAchievementCategory, readonly BgsHeroStat[], boolean],
			),
			filter(
				([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => !!selectionOptions?.length,
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => {
				const heroAchievements: readonly VisualAchievement[] = heroesAchievementCategory?.retrieveAllAchievements();
				const heroOverviews = selectionOptions.map((cardId) => {
					const normalized = normalizeHeroCardId(cardId, true);
					const existingStat = stats.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat || BgsHeroStat.create({ id: normalized } as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
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
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
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
