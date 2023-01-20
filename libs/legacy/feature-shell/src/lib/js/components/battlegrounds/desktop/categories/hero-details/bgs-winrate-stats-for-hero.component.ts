import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { BgsPostMatchStatsForReview } from '../../../../../models/battlegrounds/bgs-post-match-stats-for-review';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsHeroStat } from '../../../../../models/battlegrounds/stats/bgs-hero-stat';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
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

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.values$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(
				([main, nav]) => main.battlegrounds.lastHeroPostMatchStats,
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			),
		).pipe(
			map(
				([heroStats, [postMatch, battlegrounds, selectedCategoryId]]) =>
					[heroStats, postMatch, currentBgHeroId(battlegrounds, selectedCategoryId)] as [
						BgsHeroStat[],
						BgsPostMatchStatsForReview[],
						string,
					],
			),
			filter(([heroStats, postMatch, heroId]) => !!heroStats && !!postMatch && !!heroId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([heroStats, postMatch, heroId]) => this.buildValue(heroStats, postMatch, heroId)),
		);
	}

	private buildValue(
		heroStats: readonly BgsHeroStat[],
		postMatch: readonly BgsPostMatchStatsForReview[],
		heroId: string,
	): Value {
		const heroStatsOverTurn: (readonly BattleResultHistory[])[] = postMatch
			.map((postMatch) => postMatch.stats.battleResultHistory)
			.filter((stats) => stats && stats.length) as (readonly BattleResultHistory[])[];

		const maxTurn = Math.max(...heroStatsOverTurn.map((stats) => stats[stats.length - 1].turn));
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
		return {
			community: heroStats
				.find((stat) => stat.id === heroId)
				?.combatWinrate?.filter((stat) => stat.turn > 0)
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
