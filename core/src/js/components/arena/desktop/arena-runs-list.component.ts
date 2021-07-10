import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaRun } from '../../../models/arena/arena-run';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { DuelsRun } from '../../../models/duels/duels-run';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationArena } from '../../../models/mainwindow/navigation/navigation-arena';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';

@Component({
	selector: 'arena-runs-list',
	styleUrls: [`../../../../css/component/arena/desktop/arena-runs-list.component.scss`],
	template: `
		<div class="arena-runs-container">
			<infinite-scroll *ngIf="groupedRuns?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let groupedRun of groupedRuns; trackBy: trackByGroupedRun" class="grouped-runs">
					<div class="header">{{ groupedRun.header }}</div>
					<ul class="runs">
						<arena-run *ngFor="let run of groupedRun.runs; trackBy: trackByRun" [run]="run"></arena-run>
					</ul>
				</li>
				<div class="loading" *ngIf="isLoading">Loading more runs...</div>
			</infinite-scroll>
			<!-- <arena-empty-state *ngIf="!groupedRuns?.length"></arena-empty-state> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunsListComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		if (!value || value?.arena?.loading) {
			return;
		}
		this._state = value;
		this.updateInfos(this._state, this._navigation);
	}

	@Input() set navigation(value: NavigationArena) {
		this._navigation = value;
		this.updateInfos(this._state, this._navigation);
	}

	groupedRuns: readonly GroupedRun[] = [];
	isLoading: boolean;

	private _state: MainWindowState;
	private _navigation: NavigationArena;

	// This is used only to check for diffs between two state updates
	private arenaMatches: readonly GameStat[] = [];
	private arenaRuns: readonly ArenaRun[] = [];
	private displayedRuns: readonly ArenaRun[] = [];
	private heroFilter: ArenaClassFilterType = 'all';
	private timeFilter: ArenaTimeFilterType = 'all-time';

	private runsIterator: IterableIterator<void>;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onScroll() {
		this.runsIterator && this.runsIterator.next();
	}

	trackByGroupedRun(item: GroupedRun) {
		return item.header;
	}

	trackByRun(item: ArenaRun) {
		return item.id;
	}

	private updateInfos(state: MainWindowState, navigation: NavigationArena) {
		if (!state) {
			return;
		}

		let dirty = false;

		const arenaMatches = state.stats.gameStats.stats.filter((stat) => stat.gameMode === 'arena');
		if (!arraysEqual(arenaMatches, this.arenaMatches)) {
			this.arenaMatches = arenaMatches;
			// We only pre-compute the arena runs (and not the grouped runs) because
			// grouped runs can be modified depending on the prefs / filters, so it's
			// not truly something we can cache
			// TODO: this can be improved further, and only recreate new runs (the latest run
			// in fact)
			this.arenaRuns = this.buildArenaRuns(arenaMatches);
			dirty = true;
		}

		if (this.heroFilter !== state.arena.activeHeroFilter) {
			this.heroFilter = state.arena.activeHeroFilter;
			dirty = true;
		}

		if (this.timeFilter !== state.arena.activeTimeFilter) {
			this.timeFilter = state.arena.activeTimeFilter;
			dirty = true;
		}

		if (dirty) {
			this.handleProgressiveDisplay();
		}
	}

	private handleProgressiveDisplay() {
		this.runsIterator = this.buildIterator();
		this.onScroll();
	}

	private *buildIterator(): IterableIterator<void> {
		const workingRuns = this.arenaRuns
			.filter((match) => this.isCorrectHero(match, this.heroFilter))
			.filter((match) => this.isCorrectTime(match, this.timeFilter, this._state.arena.currentArenaMetaPatch));
		const step = 10;

		while (workingRuns.length > 0) {
			// console.log('working runs', workingRuns.length);
			const currentRuns = [];
			while (
				workingRuns.length > 0 &&
				(currentRuns.length === 0 || this.getTotalRunsLength(currentRuns) < step)
			) {
				currentRuns.push(...workingRuns.splice(0, 1));
			}
			this.displayedRuns = [...this.displayedRuns, ...currentRuns];
			this.groupedRuns = this.groupRuns(this.displayedRuns);
			this.isLoading = workingRuns.length > 0;
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

	private isCorrectHero(run: ArenaRun, heroFilter: ArenaClassFilterType): boolean {
		return !heroFilter || heroFilter === 'all' || run.getFirstMatch()?.playerClass?.toLowerCase() === heroFilter;
	}

	private isCorrectTime(run: ArenaRun, timeFilter: ArenaTimeFilterType, patch: PatchInfo): boolean {
		if (timeFilter === 'all-time') {
			return true;
		}
		const firstMatch = run.getFirstMatch();
		const firstMatchTimestamp = firstMatch.creationTimestamp;
		switch (timeFilter) {
			case 'last-patch':
				return firstMatch.buildNumber >= patch.number;
			case 'past-three':
				return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
			default:
				return true;
		}
	}

	private buildArenaRuns(arenaMatches: GameStat[]): readonly ArenaRun[] {
		const groupedByRun = groupByFunction((match: GameStat) => match.runId)(arenaMatches);
		return Object.values(groupedByRun).map((matches: readonly GameStat[]) => {
			const firstMatch = matches[0];
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: matches.filter((match) => match.result === 'won').length,
				losses: matches.filter((match) => match.result === 'lost').length,
				steps: matches,
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

	private getTotalRunsLength(currentReplays: readonly DuelsRun[]): number {
		return currentReplays ? currentReplays.length : 0;
	}
}

interface GroupedRun {
	readonly header: string;
	readonly runs: readonly ArenaRun[];
}
