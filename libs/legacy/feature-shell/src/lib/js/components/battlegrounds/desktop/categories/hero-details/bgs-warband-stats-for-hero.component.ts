import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaHeroStatTierItem } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { BgsPostMatchStatsForReview } from '../../../../../models/battlegrounds/bgs-post-match-stats-for-review';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-warband-stats-for-hero',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component.scss`,
	],
	template: `
		<graph-with-comparison-new
			*ngIf="values$ | async as values"
			[turnLabel]="'app.battlegrounds.personal-stats.hero-details.warband-stats.turn-label' | owTranslate"
			[statLabel]="'app.battlegrounds.personal-stats.hero-details.warband-stats.stat-label' | owTranslate"
			[communityValues]="values.community"
			[yourValues]="values.your"
			[communityLabel]="
				'app.battlegrounds.personal-stats.hero-details.warband-stats.community-label' | owTranslate
			"
			[yourLabel]="'app.battlegrounds.personal-stats.hero-details.warband-stats.your-label' | owTranslate"
			[communityTooltip]="
				'app.battlegrounds.personal-stats.hero-details.warband-stats.community-tooltip' | owTranslate
			"
			[yourTooltip]="'app.battlegrounds.personal-stats.hero-details.warband-stats.your-tooltip' | owTranslate"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWarbandStatsForHeroComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	values$: Observable<Value>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.values$ = combineLatest([
			this.store.bgsMetaStatsHero$(),
			this.store.listen$(
				([main, nav]) => main.battlegrounds.lastHeroPostMatchStats,
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			),
		]).pipe(
			map(([heroStats, [postMatch, battlegrounds, selectedCategoryId]]) => ({
				heroStats: heroStats,
				postMatch: postMatch,
				heroId: currentBgHeroId(battlegrounds, selectedCategoryId),
			})),
			filter((info) => !!info.heroStats?.length && !!info.postMatch && !!info.heroId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData((info) => this.buildValue(info.heroStats, info.postMatch, info.heroId)),
		);
	}

	private buildValue(
		heroStats: readonly BgsMetaHeroStatTierItem[],
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
		const heroStat = heroStats.find((stat) => stat.id === heroId);
		console.debug('building value', heroStat, heroStats, postMatch, heroId);
		return {
			community: heroStat?.warbandStats
				?.map((stat) => ({ turn: stat.turn, value: stat.averageStats } as NumericTurnInfo))
				.filter((stat) => stat)
				.slice(0, 15),
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
