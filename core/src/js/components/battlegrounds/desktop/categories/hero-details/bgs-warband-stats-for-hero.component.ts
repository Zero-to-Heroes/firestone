import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsPostMatchStatsForReview } from '../../../../../models/battlegrounds/bgs-post-match-stats-for-review';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsHeroStat } from '../../../../../models/battlegrounds/stats/bgs-hero-stat';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog, currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../../services/utils';

@Component({
	selector: 'bgs-warband-stats-for-hero',
	styleUrls: [
		`../../../../../../css/global/reset-styles.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component.scss`,
	],
	template: `
		<graph-with-comparison-new
			*ngIf="values$ | async as values"
			[communityValues]="values.community"
			[yourValues]="values.your"
			communityTooltip="Average total stats (attack + health) on board at the beginning of each turn battle (top4 6000+ MMR)"
			yourTooltip="Your values for this hero"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWarbandStatsForHeroComponent {
	values$: Observable<Value>;

	constructor(private readonly store: AppUiStoreFacadeService, private readonly cdr: ChangeDetectorRef) {
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
			map(([heroStats, postMatch, heroId]) => this.buildValue(heroStats, postMatch, heroId)),
			distinctUntilChanged((v1, v2) => this.areValuesEqual(v1, v2)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((values: Value) => cdLog('emitting in ', this.constructor.name, values)),
		);
	}

	private buildValue(
		heroStats: readonly BgsHeroStat[],
		postMatch: readonly BgsPostMatchStatsForReview[],
		heroId: string,
	): Value {
		const heroStatsOverTurn: (readonly NumericTurnInfo[])[] = postMatch
			.map((postMatch) => postMatch.stats.totalStatsOverTurn)
			.filter((stats) => stats && stats.length) as (readonly NumericTurnInfo[])[];
		const maxTurn = Math.max(...heroStatsOverTurn.map((stats) => stats[stats.length - 1].turn));
		const your =
			maxTurn <= 0
				? []
				: [...Array(maxTurn).keys()]
						.map((turn) => {
							const statsForTurn = heroStatsOverTurn
								.map((stats) => (stats.length > turn ? stats[turn] : null))
								.filter((stat) => stat)
								.map((stat) => stat.value);
							return statsForTurn.length > 0
								? {
										turn: turn,
										value: statsForTurn.reduce((a, b) => a + b, 0) / statsForTurn.length,
								  }
								: null;
						})
						.filter((info) => info);
		return {
			community: heroStats
				.find((stat) => stat.id === heroId)
				?.warbandStats?.map((stat) => ({ turn: stat.turn, value: stat.totalStats } as NumericTurnInfo))
				.filter((stat) => stat),
			your: your,
		} as Value;
	}

	private areValuesEqual(v1: Value, v2: Value): boolean {
		return (
			arraysEqual(
				v1.community.map((v) => v.turn),
				v2.community.map((v) => v.turn),
			) &&
			arraysEqual(
				v1.community.map((v) => v.value),
				v2.community.map((v) => v.value),
			) &&
			arraysEqual(
				v1.your.map((v) => v.turn),
				v2.your.map((v) => v.turn),
			) &&
			arraysEqual(
				v1.your.map((v) => v.value),
				v2.your.map((v) => v.value),
			)
		);
	}
}

interface Value {
	readonly community: readonly NumericTurnInfo[];
	readonly your: readonly NumericTurnInfo[];
}
