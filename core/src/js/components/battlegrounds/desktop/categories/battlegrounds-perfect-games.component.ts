import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewRef } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { GroupedReplays } from '../../../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';
import { arraysEqual, groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-perfect-games',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-perfect-games.component.scss`,
	],
	template: `
		<div class="battlegrounds-perfect-games">
			<infinite-scroll *ngIf="allReplays?.length" class="replays-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let groupedReplay of displayedGroupedReplays" class="grouped-replays">
					<grouped-replays [groupedReplays]="groupedReplay"></grouped-replays>
				</li>
				<div class="loading" *ngIf="isLoading" (click)="onScroll()">Click to load more replays</div>
			</infinite-scroll>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPerfectGamesComponent implements OnDestroy {
	isLoading: boolean;
	allReplays: readonly GameStat[];
	displayedGroupedReplays: readonly GroupedReplays[] = [];

	private sub$$: Subscription;
	private displayedReplays: readonly GameStat[] = [];
	private gamesIterator: IterableIterator<void>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreService) {
		this.sub$$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.perfectGames,
				([main, nav]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveHeroFilter,
			)
			.pipe(
				filter(([perfectGames, mmrPercentiles, rankFilter, heroFilter]) => !!perfectGames?.length),
				distinctUntilChanged((a, b) => this.areEqual(a, b)),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
			)
			.subscribe(([gameStats, mmrPercentiles, rankFilter, heroFilter]) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedReplays = [];
					this.displayedGroupedReplays = [];
					const mmrThreshold = getMmrThreshold(rankFilter, mmrPercentiles);
					this.gamesIterator = this.buildIterator(gameStats, mmrThreshold, heroFilter, 8);
					// console.debug('gamesIterator', this.gamesIterator);
					this.onScroll();
				});
			});
	}

	ngOnDestroy() {
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.gamesIterator && this.gamesIterator.next();
	}

	private *buildIterator(
		perfectGames: readonly GameStat[],
		rankFilter: number,
		heroFilter: string,
		step = 40,
	): IterableIterator<void> {
		this.allReplays = this.applyFilters(perfectGames ?? [], rankFilter, heroFilter);
		const workingReplays = [...this.allReplays];
		while (workingReplays.length > 0) {
			const currentReplays = [];
			while (workingReplays.length > 0 && currentReplays.length < step) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			this.displayedGroupedReplays = this.groupReplays(this.displayedReplays);
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
		a: [readonly GameStat[], readonly MmrPercentile[], number, string],
		b: [readonly GameStat[], readonly MmrPercentile[], number, string],
	): boolean {
		// console.debug('areEqual', a, b);
		if (a[2] !== b[2] || a[3] !== b[3]) {
			return false;
		}
		return arraysEqual(a[0], b[0]) && arraysEqual(a[1], b[1]);
	}

	private applyFilters(replays: readonly GameStat[], rankFilter: number, heroFilter: string): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, rankFilter))
			.filter((replay) => this.heroFilter(replay, heroFilter));
	}

	private rankFilter(stat: GameStat, rankFilter: number) {
		if (!rankFilter) {
			return true;
		}
		return stat.playerRank && parseInt(stat.playerRank) >= rankFilter;
	}

	private heroFilter(stat: GameStat, heroFilter: string) {
		if (!heroFilter) {
			return true;
		}

		switch (heroFilter) {
			case 'all':
			case null:
				return true;
			default:
				return stat.playerCardId === heroFilter;
		}
	}

	private groupReplays(replays: readonly GameStat[]): readonly GroupedReplays[] {
		const groupingFunction = (replay: GameStat) => {
			const date = new Date(replay.creationTimestamp);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const replaysByDate = groupByDate(replays);
		return Object.keys(replaysByDate).map((date) => ({
			header: date,
			replays: replaysByDate[date],
		}));
	}
}
