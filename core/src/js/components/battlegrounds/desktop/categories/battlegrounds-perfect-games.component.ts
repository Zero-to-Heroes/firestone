import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { BattlegroundsAppState } from '../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { GroupedReplays } from '../../../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { groupByFunction } from '../../../../services/utils';

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
				<div class="loading" *ngIf="isLoading">Loading more replays...</div>
			</infinite-scroll>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPerfectGamesComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.displayedReplays = [];
		this.displayedGroupedReplays = [];
		this.handleProgressiveDisplay();
	}

	isLoading: boolean;
	allReplays: readonly GameStat[];
	displayedReplays: readonly GameStat[] = [];
	displayedGroupedReplays: readonly GroupedReplays[] = [];

	private _state: MainWindowState;
	private gamesIterator: IterableIterator<void>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onScroll() {
		this.gamesIterator && this.gamesIterator.next();
	}

	private handleProgressiveDisplay() {
		if (!this._state) {
			return;
		}
		this.gamesIterator = this.buildIterator();
		this.onScroll();
	}

	private *buildIterator(): IterableIterator<void> {
		this.allReplays = this.applyFilters(this._state.battlegrounds.perfectGames ?? [], this._state.battlegrounds);
		const workingReplays = [...this.allReplays];
		const step = 40;
		while (workingReplays.length > 0) {
			// console.log('working runs', workingRuns.length);
			const currentReplays = [];
			while (workingReplays.length > 0 && currentReplays.length < step) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			this.displayedGroupedReplays = this.groupReplays(this.displayedReplays);
			this.isLoading = this.allReplays.length > step;
			console.debug('built grouped replays', this.displayedGroupedReplays);
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

	private applyFilters(replays: readonly GameStat[], state: BattlegroundsAppState): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, state.activeRankFilter))
			.filter((replay) => this.heroFilter(replay, state.activeHeroFilter));
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
