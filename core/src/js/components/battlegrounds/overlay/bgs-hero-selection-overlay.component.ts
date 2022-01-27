import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../models/visual-achievement-category';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-hero-selection-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-selection-overlay.component.scss',
	],
	template: `
		<div
			class="app-container battlegrounds-theme bgs-hero-selection-overlay"
			[ngClass]="{ 'with-hero-tooltips': heroTooltipActive$ | async }"
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
export class BgsHeroSelectionOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroOverviews$: Observable<InternalBgsHeroStat[]>;
	heroTooltipActive$: Observable<boolean>;

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
		this.heroTooltipActive$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsShowHeroSelectionTooltip)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting heroTooltipActive in ', this.constructor.name, info)),
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
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			filter(
				([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => !!selectionOptions?.length,
			),
			map(([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => {
				const heroAchievements: readonly VisualAchievement[] = heroesAchievementCategory?.retrieveAllAchievements();
				const heroOverviews = selectionOptions.map((cardId, index) => {
					const normalized = normalizeHeroCardId(cardId, true);
					const existingStat = stats.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat || BgsHeroStat.create({ id: normalized } as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					const tooltipPosition =
						selectionOptions.length === 4 && index <= 1
							? 'right'
							: selectionOptions.length === 2 && index === 0
							? 'right'
							: 'left';
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
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('update hero selection overlay', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
}
