import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TooltipPositionType } from '../../../directives/cached-component-tooltip.directive';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../models/visual-achievement-category';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
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
		this.heroOverviews$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		).pipe(
			map(
				([stats, [achievements], [panels, showAchievements]]) =>
					[
						stats,
						achievements.findCategory('hearthstone_game_sub_13'),
						panels.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
						showAchievements,
					] as readonly [
						readonly BgsHeroStat[],
						VisualAchievementCategory,
						BgsHeroSelectionOverviewPanel,
						boolean,
					],
			),
			filter(
				([stats, heroesAchievementCategory, panel, showAchievements]) =>
					!!panel?.heroOptionCardIds?.length && !!heroesAchievementCategory,
			),
			map(
				([stats, heroesAchievementCategory, panel, showAchievements]) =>
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
			this.mapData(([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => {
				const heroAchievements: readonly VisualAchievement[] =
					heroesAchievementCategory?.retrieveAllAchievements();
				const heroOverviews = selectionOptions.map((cardId, index) => {
					const normalized = normalizeHeroCardId(cardId, this.allCards);
					const existingStat = stats.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat || BgsHeroStat.create({ id: normalized } as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					const tooltipPosition: TooltipPositionType = 'fixed-top-center';
					return {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						achievements: achievementsForHero,
						tooltipPosition: tooltipPosition,
						tooltipClass: `hero-selection-overlay ${tooltipPosition}`,
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
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
	readonly tooltipPosition: TooltipPositionType;
	readonly tooltipClass: string;
}
