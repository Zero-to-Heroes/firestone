import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BattlegroundsNavigationService, BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BgsPostMatchStatsForReview, NumericTurnInfo } from '@firestone/game-state';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'bgs-winrate-stats-for-hero',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-winrate-stats-for-hero.component.scss`,
	],
	template: `
		<graph-with-comparison-new
			*ngIf="values$ | async as values"
			[turnLabel]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.turn-label' | owTranslate"
			[statLabel]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.winrate-label' | owTranslate"
			[communityValues]="values.community"
			[yourValues]="values.your"
			[communityLabel]="
				'app.battlegrounds.personal-stats.hero-details.winrate-stats.community-label' | owTranslate
			"
			[yourLabel]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.your-label' | owTranslate"
			[communityTooltip]="
				'app.battlegrounds.personal-stats.hero-details.winrate-stats.community-tooltip' | owTranslate
			"
			[yourTooltip]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.your-tooltip' | owTranslate"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWinrateStatsForHeroComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	values$: Observable<Value>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly heroStats: BgsPlayerHeroStatsService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.heroStats, this.nav);

		this.values$ = combineLatest([
			this.heroStats.tiersWithPlayerData$$,
			this.store.listen$(([main, nav]) => main.battlegrounds.lastHeroPostMatchStats),
			this.nav.selectedCategoryId$$,
		]).pipe(
			map(([heroStats, [postMatch], selectedCategoryId]) => ({
				heroStats: heroStats,
				postMatch: postMatch,
				heroId: currentBgHeroId(selectedCategoryId),
			})),
			filter((info) => !!info.heroStats?.length && !!info.postMatch && !!info.heroId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData((info) => this.buildValue(info.heroStats, info.postMatch, info.heroId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildValue(
		heroStats: readonly BgsMetaHeroStatTierItem[],
		postMatch: readonly BgsPostMatchStatsForReview[],
		heroId: string,
	): Value {
		const heroStatsOverTurn: (readonly BattleResultHistory[])[] = postMatch
			.map((postMatch) => postMatch.stats?.battleResultHistory)
			.filter((stats) => !!stats?.length) as (readonly BattleResultHistory[])[];

		const allTurns = heroStatsOverTurn
			.flatMap((stats) => stats.map((stat) => stat.turn))
			.filter((turn) => !isNaN(turn));
		const maxTurn = Math.max(...allTurns);
		const your =
			maxTurn <= 0
				? []
				: [...Array(maxTurn).keys()]
						.filter((turn) => turn > 0)
						.map((turn) => {
							const statsForTurn = heroStatsOverTurn
								.map((stats) => stats.find((stat) => stat.turn === turn))
								.filter((stat) => stat)
								.filter((stat) => stat.simulationResult.wonPercent != null)
								.map((stat) => stat.simulationResult.wonPercent);

							return {
								turn: turn,
								value:
									statsForTurn.length > 0
										? Math.round(
												(10 * statsForTurn.reduce((a, b) => a + b, 0)) / statsForTurn.length,
										  ) / 10
										: null,
							};
						});
		const heroStat = heroStats.find((stat) => stat.id === heroId);
		console.debug('building value', heroStat, heroStats, postMatch, heroId);
		return {
			community: heroStat?.combatWinrate
				?.filter((stat) => stat.turn > 0)
				?.map((stat) => ({ turn: stat.turn, value: Math.round(10 * stat.winrate) / 10 } as NumericTurnInfo))
				.filter((stat) => stat)
				.slice(0, 15),
			your: your,
		} as Value;
	}
}

interface Value {
	readonly community: readonly NumericTurnInfo[];
	readonly your: readonly NumericTurnInfo[];
}
