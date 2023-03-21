import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsHeroTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { VisualAchievement } from '../../../models/visual-achievement';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-hero-selection-overview',
	styleUrls: [`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-overview.component.scss`],
	template: `
		<div class="container">
			<div class="left" *ngIf="!(showAds$ | async)">
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
export class BgsHeroSelectionOverviewComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	// tiers$: Observable<readonly BgsMetaHeroStatTier[]>;
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		const tiers$ = this.store.bgsMetaStatsHero$().pipe(this.mapData((stats) => buildTiers(stats, this.i18n)));
		this.showAds$ = this.store.showAds$().pipe(this.mapData((showAds) => showAds));

		this.heroOverviews$ = combineLatest([
			tiers$,
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) =>
					// Filter here to avoid recomputing achievements info every time something changes in
					// another panel (finding the right panel is inexpensive)
					main.panels?.find(
						(panel) => panel.id === 'bgs-hero-selection-overview',
					) as BgsHeroSelectionOverviewPanel,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		]).pipe(
			this.mapData(([tiers, [achievements], [panel, showAchievements]]) => {
				const heroesAchievementCategory = achievements.findCategory('hearthstone_game_sub_13');
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
				if (heroOverviews.length === 2) {
					return [null, ...heroOverviews, null];
				} else if (heroOverviews.length === 3) {
					return [...heroOverviews, null];
				} else {
					return heroOverviews;
				}
			}),
		);
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
}

interface InternalBgsHeroStat extends BgsMetaHeroStatTierItem {
	readonly achievements: readonly VisualAchievement[];
}
