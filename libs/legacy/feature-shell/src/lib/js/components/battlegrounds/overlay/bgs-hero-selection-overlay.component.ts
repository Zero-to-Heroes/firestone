import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TooltipPositionType } from '../../../directives/cached-component-tooltip.directive';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { VisualAchievement } from '../../../models/visual-achievement';
import { BgsMetaHeroStatTierItem } from '../../../services/battlegrounds/bgs-meta-hero-stats';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-hero-selection-overlay',
	styleUrls: [
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-selection-overlay.component.scss',
	],
	template: `
		<div
			class="app-container battlegrounds-theme bgs-hero-selection-overlay"
			[ngClass]="{
				'with-hero-tooltips': heroTooltipActive$ | async,
				'with-tier-overlay': showTierOverlay$ | async
			}"
		>
			<bgs-hero-overview
				*ngFor="let hero of (heroOverviews$ | async) || []; trackBy: trackByHeroFn"
				[hero]="hero"
				[achievements]="hero?.achievements"
				[hideEmptyState]="true"
				[heroTooltipPosition]="hero?.tooltipPosition"
				[tooltipAdditionalClass]="hero?.tooltipClass"
			></bgs-hero-overview>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverlayComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	heroOverviews$: Observable<InternalBgsHeroStat[]>;
	heroTooltipActive$: Observable<boolean>;
	showTierOverlay$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly init_DebugService: DebugService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroTooltipActive$ = this.listenForBasicPref$((prefs) => prefs.bgsShowHeroSelectionTooltip);
		this.showTierOverlay$ = this.listenForBasicPref$((prefs) => prefs.bgsShowHeroSelectionTiers);
		this.heroOverviews$ = combineLatest([
			this.store.bgsMetaStatsHero$(),
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		]).pipe(
			map(([stats, [achievements], [panels, showAchievements]]) => ({
				stats: stats,
				heroesAchievementCategory: achievements.findCategory('hearthstone_game_sub_13'),
				panel: panels.find(
					(panel) => panel.id === 'bgs-hero-selection-overview',
				) as BgsHeroSelectionOverviewPanel,
				showAchievements: showAchievements,
			})),
			filter((info) => !!info.panel?.heroOptionCardIds?.length && !!info.heroesAchievementCategory),
			map((info) => ({
				selectionOptions:
					info.panel?.heroOptionCardIds ??
					(info.panel.selectedHeroCardId ? [info.panel.selectedHeroCardId] : null),
				heroesAchievementCategory: info.heroesAchievementCategory,
				stats: info.stats,
				showAchievements: info.showAchievements,
			})),
			filter((info) => !!info.selectionOptions?.length),
			this.mapData((info) => {
				const heroAchievements: readonly VisualAchievement[] =
					info.heroesAchievementCategory?.retrieveAllAchievements();
				const heroOverviews = info.selectionOptions.map((cardId, index) => {
					const normalized = normalizeHeroCardId(cardId, this.allCards);
					const existingStat = info.stats.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat ?? ({ id: normalized } as BgsMetaHeroStatTierItem);
					const achievementsForHero: readonly VisualAchievement[] = info.showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					const tooltipPosition: TooltipPositionType = 'fixed-top-center';
					const result: InternalBgsHeroStat = {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						achievements: achievementsForHero,
						tooltipPosition: tooltipPosition,
						tooltipClass: `hero-selection-overlay ${tooltipPosition}`,
					};
					return result;
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
	}

	trackByHeroFn(index, item: BgsMetaHeroStatTierItem) {
		return item?.id;
	}
}

interface InternalBgsHeroStat extends BgsMetaHeroStatTierItem {
	readonly achievements: readonly VisualAchievement[];
	readonly tooltipPosition: TooltipPositionType;
	readonly tooltipClass: string;
}
