import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { HeaderInfo } from '@components/replays/replays-list-view.component';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaRun } from '../../../models/arena/arena-run';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'arena-runs-list',
	styleUrls: [`../../../../css/component/arena/desktop/arena-runs-list.component.scss`],
	template: `
		<div class="arena-runs-container">
			<ng-container *ngIf="{ runs: runs$ | async } as value">
				<virtual-scroller
					#scroll
					*ngIf="value.runs?.length; else emptyState"
					class="runs-list"
					[items]="value.runs"
					scrollable
				>
					<ng-container *ngFor="let run of scroll.viewPortItems; trackBy: trackByRun">
						<div class="header" *ngIf="run.header">{{ run.header }}</div>
						<arena-run *ngIf="!run.header" [run]="run"></arena-run>
					</ng-container>
				</virtual-scroller>
			</ng-container>

			<ng-template #emptyState>
				<arena-empty-state></arena-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunsListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	runs$: Observable<(ArenaRun | HeaderInfo)[]>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// TODO perf: split this into two observables, so that we don't reocmpute the
		// arena runs when a filter changes?
		this.runs$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.arena.rewards,
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.activeHeroFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
			),
		).pipe(
			filter(([stats, [rewards, timeFilter, heroFilter, patch]]) => !!stats?.length),
			this.mapData(([stats, [rewards, timeFilter, heroFilter, patch]]) => {
				const arenaMatches = stats.filter((stat) => stat.gameMode === 'arena').filter((stat) => !!stat.runId);
				const arenaRuns = this.buildArenaRuns(arenaMatches, rewards);
				const filteredRuns = arenaRuns
					.filter((match) => this.isCorrectHero(match, heroFilter))
					.filter((match) => this.isCorrectTime(match, timeFilter, patch));
				const groupedRuns = this.groupRuns(filteredRuns);
				const flat = groupedRuns
					.filter((group) => group?.runs?.length)
					.flatMap((group) => {
						return [
							{
								header: group.header,
							} as HeaderInfo,
							...group.runs,
						];
					});
				return flat;
			}),
		);
	}

	trackByRun(index: number, item: ArenaRun) {
		return item.id;
	}

	private isCorrectHero(run: ArenaRun, heroFilter: ArenaClassFilterType): boolean {
		return !heroFilter || heroFilter === 'all' || run.getFirstMatch()?.playerClass?.toLowerCase() === heroFilter;
	}

	private isCorrectTime(run: ArenaRun, timeFilter: ArenaTimeFilterType, patch: PatchInfo): boolean {
		if (timeFilter === 'all-time') {
			return true;
		}
		const firstMatch = run.getFirstMatch();
		if (!firstMatch) {
			return false;
		}

		const firstMatchTimestamp = firstMatch.creationTimestamp;
		switch (timeFilter) {
			case 'last-patch':
				// See bgs-ui-helper
				return (
					!!patch &&
					(firstMatch.buildNumber >= patch.number ||
						firstMatch.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000)
				);
			case 'past-three':
				return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
			default:
				return true;
		}
	}

	private buildArenaRuns(
		arenaMatches: readonly GameStat[],
		rewards: readonly ArenaRewardInfo[],
	): readonly ArenaRun[] {
		const matchesGroupedByRun = !!arenaMatches?.length
			? groupByFunction((match: GameStat) => match.runId)(arenaMatches)
			: {};
		const rewardsGroupedByRun = !!rewards?.length
			? groupByFunction((reward: ArenaRewardInfo) => reward.runId)(rewards)
			: {};
		return Object.keys(matchesGroupedByRun).map((runId: string) => {
			const matches: readonly GameStat[] = matchesGroupedByRun[runId];
			const rewards = rewardsGroupedByRun[runId];
			const firstMatch = matches[0];
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: matches.filter((match) => match.result === 'won').length,
				losses: matches.filter((match) => match.result === 'lost').length,
				steps: matches,
				rewards: rewards,
			} as ArenaRun);
		});
	}

	private groupRuns(runs: readonly ArenaRun[]): readonly GroupedRun[] {
		const groupingFunction = (run: ArenaRun) => {
			const date = new Date(run.creationTimestamp);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const runsByDate = groupByDate(runs);
		return Object.keys(runsByDate).map((date) => ({
			header: date,
			runs: runsByDate[date],
		}));
	}
}

interface GroupedRun {
	readonly header: string;
	readonly runs: readonly ArenaRun[];
}
