import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { GroupedReplays } from '../../../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
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
				([main, nav]) => main.battlegrounds.activeRankFilter,
				([main, nav]) => main.battlegrounds.activeHeroFilter,
			)
			.pipe(
				filter(([perfectGames, rankFilter, heroFilter]) => !!perfectGames?.length),
				distinctUntilChanged((a, b) => this.areEqual(a, b)),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
			)
			.subscribe(([gameStats, rankFilter, heroFilter]) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedReplays = [];
					this.displayedGroupedReplays = [];
					this.gamesIterator = this.buildIterator(gameStats, rankFilter, heroFilter, 8);
					// console.debug('gamesIterator', this.gamesIterator);
					this.onScroll();
				});
			});
	}

	ngOnDestroy() {
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		// console.debug('loading more replays', this.gamesIterator);
		const result = this.gamesIterator && this.gamesIterator.next();
		// console.debug('loaded', result);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private *buildIterator(
		perfectGames: readonly GameStat[],
		rankFilter: string,
		heroFilter: string,
		step: number = 40,
	): IterableIterator<void> {
		this.allReplays = this.applyFilters(perfectGames ?? [], rankFilter, heroFilter);
		const workingReplays = [...this.allReplays];
		while (workingReplays.length > 0) {
			// console.debug('workingReplays', workingReplays.length);
			const currentReplays = [];
			while (workingReplays.length > 0 && currentReplays.length < step) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			this.displayedGroupedReplays = this.groupReplays(this.displayedReplays);
			this.isLoading = this.allReplays.length > step;
			// console.debug('built grouped replays', this.displayedGroupedReplays, workingReplays);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			yield;
		}
		this.isLoading = false;
		// console.debug('all replays loaded');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return;
	}

	private areEqual(a: [readonly GameStat[], string, string], b: [readonly GameStat[], string, string]): boolean {
		// console.debug('areEqual', a, b);
		if (a[1] !== b[1] || a[2] !== b[2]) {
			return false;
		}
		return arraysEqual(a[0], b[0]);
	}

	private applyFilters(replays: readonly GameStat[], rankFilter: string, heroFilter: string): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, rankFilter))
			.filter((replay) => this.heroFilter(replay, heroFilter));
	}

	private rankFilter(stat: GameStat, rankFilter: BgsRankFilterType) {
		if (!rankFilter) {
			return true;
		}

		switch (rankFilter) {
			case 'all':
				return true;
			default:
				return stat.playerRank && parseInt(stat.playerRank) >= parseInt(rankFilter);
		}
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
