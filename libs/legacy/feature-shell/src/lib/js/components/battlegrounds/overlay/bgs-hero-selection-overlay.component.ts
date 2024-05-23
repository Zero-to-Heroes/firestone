import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { isBattlegroundsDuo } from '@firestone-hs/reference-data';
import {
	BgsHeroSelectionOverviewPanel,
	BgsPlayerHeroStatsService,
	BgsStateFacadeService,
	Config,
	DEFAULT_MMR_PERCENTILE,
} from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { TooltipPositionType } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs';
import { VisualAchievement } from '../../../models/visual-achievement';
import { findCategory } from '../../../services/achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../services/achievement/achievements-state-manager.service';
import { AdService } from '../../../services/ad.service';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-hero-selection-overlay',
	styleUrls: ['../../../../css/themes/battlegrounds-theme.scss', './bgs-hero-selection-overlay.component.scss'],
	template: `
		<div
			class="app-container battlegrounds-theme bgs-hero-selection-overlay heroes-{{ value.overviews?.length }}"
			*ngIf="{ overviews: heroOverviews$ | async } as value"
		>
			<bgs-hero-selection-overlay-info
				*ngFor="let hero of value.overviews || []; trackBy: trackByHeroFn"
				[hero]="hero"
				[achievements]="hero?.achievements"
			></bgs-hero-selection-overlay-info>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroOverviews$: Observable<readonly InternalBgsHeroStat[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly bgsState: BgsStateFacadeService,
		private readonly gameState: GameStateFacadeService,
		private readonly ads: AdService,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly achievements: AchievementsStateManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.bgsState, this.ads, this.playerHeroStats, this.achievements);

		const statsConfigs: Observable<ExtendedConfig> = combineLatest([
			this.gameState.gameState$$,
			this.bgsState.gameState$$,
			this.prefs.preferences$$,
		]).pipe(
			debounceTime(500),
			filter(([gameState, bgState, prefs]) => !!gameState && !!bgState?.currentGame && !!prefs),
			this.mapData(([gameState, bgState, prefs]) => {
				const config: ExtendedConfig = {
					gameMode: isBattlegroundsDuo(gameState.metadata.gameType) ? 'battlegrounds-duo' : 'battlegrounds',
					timeFilter: 'last-patch',
					mmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection ? bgState.currentGame.mmrAtStart ?? 0 : null,
					rankFilter: DEFAULT_MMR_PERCENTILE,
					tribesFilter: prefs.bgsActiveUseTribesFilterInHeroSelection
						? bgState.currentGame.availableRaces
						: [],
					anomaliesFilter: bgState.currentGame.anomalies ?? [],
				};
				return config;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			tap((info) => console.debug('[debug] updated config', info)),
			takeUntil(this.destroyed$),
		);
		const tiers$ = statsConfigs.pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			tap((info) => console.debug('[debug] rebuilding stats overlay', info)),
			switchMap((config) => this.playerHeroStats.buildFinalStats(config, config.mmrFilter)),
			// tap((info) => console.debug('[debug] updated tiers', info)),
			this.mapData((stats) => buildTiers(stats?.stats, this.i18n)),
		);

		this.heroOverviews$ = combineLatest([
			tiers$,
			this.achievements.groupedAchievements$$,
			this.bgsState.gameState$$.pipe(
				this.mapData(
					(main) =>
						main?.panels?.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
				),
			),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowHeroSelectionAchievements)),
		]).pipe(
			this.mapData(([tiers, achievements, panel, showAchievements]) => {
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

interface ExtendedConfig extends Config {
	mmrFilter: number;
}
