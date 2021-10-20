import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, ViewRef } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaRun } from '../../../models/arena/arena-run';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'arena-runs-list',
	styleUrls: [`../../../../css/component/arena/desktop/arena-runs-list.component.scss`],
	template: `
		<div class="arena-runs-container">
			<infinite-scroll *ngIf="allReplays?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let groupedRun of displayedGroupedReplays; trackBy: trackByGroupedRun" class="grouped-runs">
					<div class="header">{{ groupedRun.header }}</div>
					<ul class="runs">
						<arena-run *ngFor="let run of groupedRun.runs; trackBy: trackByRun" [run]="run"></arena-run>
					</ul>
				</li>
				<div class="loading" *ngIf="isLoading" (click)="onScroll()">Click to load more runs</div>
			</infinite-scroll>
			<arena-empty-state *ngIf="!allReplays?.length"></arena-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunsListComponent extends AbstractSubscriptionComponent implements OnDestroy {
	isLoading: boolean;
	allReplays: readonly ArenaRun[];
	displayedGroupedReplays: readonly GroupedRun[] = [];

	private sub$$: Subscription;
	private displayedReplays: readonly ArenaRun[] = [];
	private gamesIterator: IterableIterator<void>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreFacadeService) {
		super();
		// TODO perf: split this into two observables, so that we don't reocmpute the
		// arena runs when a filter changes?
		this.sub$$ = this.store
			.listen$(
				([main, nav]) => main.stats.gameStats.stats,
				([main, nav]) => main.arena.rewards,
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.activeHeroFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
			)
			.pipe(
				takeUntil(this.destroyed$),
				filter(([stats, rewards, timeFilter, heroFilter, patch]) => !!stats?.length),
				distinctUntilChanged((a, b) => this.areEqual(a, b)),
				map(([stats, rewards, timeFilter, heroFilter, patch]) => {
					const arenaMatches = stats
						.filter((stat) => stat.gameMode === 'arena')
						.filter((stat) => !!stat.runId);
					return [this.buildArenaRuns(arenaMatches, rewards), timeFilter, heroFilter, patch] as [
						readonly ArenaRun[],
						ArenaTimeFilterType,
						ArenaClassFilterType,
						PatchInfo,
					];
				}),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
			)
			.subscribe(([arenaRuns, timeFilter, heroFilter, patch]) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedReplays = [];
					this.displayedGroupedReplays = [];
					this.gamesIterator = this.buildIterator(arenaRuns, timeFilter, heroFilter, patch, 8);

					this.onScroll();
				});
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.gamesIterator && this.gamesIterator.next();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByGroupedRun(item: GroupedRun) {
		return item.header;
	}

	trackByRun(item: ArenaRun) {
		return item.id;
	}

	private *buildIterator(
		arenaMatches: readonly ArenaRun[],
		timeFilter: ArenaTimeFilterType,
		heroFilter: ArenaClassFilterType,
		patch: PatchInfo,
		step = 40,
	): IterableIterator<void> {
		this.allReplays = arenaMatches
			.filter((match) => this.isCorrectHero(match, heroFilter))
			.filter((match) => this.isCorrectTime(match, timeFilter, patch));
		const workingReplays = [...this.allReplays];
		while (workingReplays.length > 0) {
			const currentReplays: ArenaRun[] = [];
			while (workingReplays.length > 0 && currentReplays.length < step) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			this.displayedGroupedReplays = this.groupRuns(this.displayedReplays);
			this.isLoading = this.allReplays.length > step;

			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			yield;
		}
		this.isLoading = false;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return;
	}

	private areEqual(
		a: [readonly GameStat[], readonly ArenaRewardInfo[], string, string, PatchInfo],
		b: [readonly GameStat[], readonly ArenaRewardInfo[], string, string, PatchInfo],
	): boolean {
		if (a[2] !== b[2] || a[3] !== b[3] || a[4] !== b[4]) {
			return false;
		}
		return arraysEqual(a[0], b[0]) && arraysEqual(a[1], b[1]);
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
				return (
					firstMatch.buildNumber >= patch.number &&
					firstMatch.creationTimestamp > new Date(patch.date).getTime()
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
		const matchesGroupedByRun = groupByFunction((match: GameStat) => match.runId)(arenaMatches);
		const rewardsGroupedByRun = groupByFunction((reward: ArenaRewardInfo) => reward.runId)(rewards);
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
			return date.toLocaleDateString('en-US', {
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
