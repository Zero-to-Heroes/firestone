import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsHeroSelectionOverviewPanel } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { TooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { VisualAchievement } from '../../../models/visual-achievement';
import { findCategory } from '../../../services/achievement/achievement-utils';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
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
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;
	heroTooltipActive$: Observable<boolean>;
	showTierOverlay$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.heroTooltipActive$ = combineLatest([this.store.enablePremiumFeatures$(), this.prefs.preferences$$]).pipe(
			this.mapData(([premium, prefs]) => premium && prefs.bgsShowHeroSelectionTooltip),
		);
		this.showTierOverlay$ = combineLatest([
			this.store.enablePremiumFeatures$(),
			this.store.listenPrefs$((prefs) => prefs.bgsShowHeroSelectionTiers),
		]).pipe(this.mapData(([premium, [bgsShowHeroSelectionTiers]]) => premium && bgsShowHeroSelectionTiers));

		const tiers$ = this.store.bgsMetaStatsHero$().pipe(this.mapData((stats) => buildTiers(stats, this.i18n)));

		this.heroOverviews$ = combineLatest([
			tiers$,
			this.store.achievementCategories$(),
			this.store.listenBattlegrounds$(
				([main, prefs]) =>
					main.panels?.find(
						(panel) => panel.id === 'bgs-hero-selection-overview',
					) as BgsHeroSelectionOverviewPanel,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		]).pipe(
			this.mapData(([tiers, achievements, [panel, showAchievements]]) => {
				const heroesAchievementCategory = findCategory('hearthstone_game_sub_13', achievements);
				if (!panel || !heroesAchievementCategory) {
					console.log('no panel or no category', !panel, !heroesAchievementCategory);
					return [];
				}

				const selectionOptions =
					panel?.heroOptionCardIds ?? (panel.selectedHeroCardId ? [panel.selectedHeroCardId] : null);
				if (!selectionOptions?.length) {
					console.log('no selection options', selectionOptions);
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
					const tooltipPosition: TooltipPositionType = 'fixed-top-center';
					return {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						tier: tier?.id,
						achievements: achievementsForHero,
						combatWinrate: statWithDefault.combatWinrate?.slice(0, 15) ?? [],
						tooltipPosition: tooltipPosition,
						tooltipClass: `hero-selection-overlay ${tooltipPosition}`,
					};
				});
				console.debug('heroOverviews', heroOverviews, tiers);
				if (heroOverviews.length === 2) {
					return [null, ...heroOverviews, null];
				} else if (heroOverviews.length === 1) {
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

	trackByHeroFn(index, item: BgsMetaHeroStatTierItem) {
		return item?.id;
	}
}

interface InternalBgsHeroStat extends BgsMetaHeroStatTierItem {
	readonly achievements: readonly VisualAchievement[];
	readonly tooltipPosition: TooltipPositionType;
	readonly tooltipClass: string;
}
