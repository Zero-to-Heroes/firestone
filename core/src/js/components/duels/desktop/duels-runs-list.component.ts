import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DuelsRun } from '../../../models/duels/duels-run';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'duels-runs-list',
	styleUrls: [`../../../../css/component/duels/desktop/duels-runs-list.component.scss`],
	template: `
		<div class="duels-runs-container">
			<infinite-scroll *ngIf="allRuns?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let groupedRun of displayedGroupedRuns; trackBy: trackByGroupedRun" class="grouped-runs">
					<div class="header">{{ groupedRun.header }}</div>
					<ul class="runs">
						<duels-run
							*ngFor="let run of groupedRun.runs; trackBy: trackByRun"
							[run]="run"
							[displayLoot]="displayLoot"
							[isExpanded]="isExpanded(run.id)"
						></duels-run>
					</ul>
				</li>
				<div class="loading" *ngIf="isLoading">Loading more runs...</div>
			</infinite-scroll>
			<duels-empty-state *ngIf="!allRuns?.length"></duels-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunsListComponent {
	@Input() set state(value: DuelsState) {
		if (value.loading) {
			return;
		}
		this._state = value;
		this.displayedRuns = [];
		this.displayedGroupedRuns = [];
		this.handleProgressiveDisplay();
	}

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		this.displayedRuns = [];
		this.displayedGroupedRuns = [];
		this.handleProgressiveDisplay();
	}

	@Input() set navigation(value: NavigationDuels) {
		this.expandedRunIds = value.expandedRunIds || [];
		this.displayedRuns = [];
		this.displayedGroupedRuns = [];
		this.handleProgressiveDisplay();
	}

	@Input() displayLoot = true;

	displayedGroupedRuns: readonly GroupedRun[] = [];
	allRuns: readonly DuelsRun[] = [];
	_state: DuelsState;
	_navigation: NavigationDuels;
	_deckstring: string;
	isLoading: boolean;
	expandedRunIds: readonly string[] = [];

	private displayedRuns: readonly DuelsRun[] = [];
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

	isExpanded(runId: string): boolean {
		return this.expandedRunIds.includes(runId);
	}

	trackByGroupedRun(item: GroupedRun) {
		return item.header;
	}

	trackByRun(item: DuelsRun) {
		return item.id;
	}

	private handleProgressiveDisplay() {
		if (!this._state) {
			return;
		}
		this.runsIterator = this.buildIterator();
		this.onScroll();
	}

	private *buildIterator(): IterableIterator<void> {
		this.allRuns = this._state.runs.filter(run => !this._deckstring || run.initialDeckList === this._deckstring);
		const workingRuns = [...this.allRuns];
		const step = 40;
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
			this.displayedGroupedRuns = this.groupRuns(this.displayedRuns);
			this.isLoading = this.allRuns.length > step;
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

	private groupRuns(runs: readonly DuelsRun[]): readonly GroupedRun[] {
		const groupingFunction = (run: DuelsRun) => {
			const date = new Date(run.creationTimestamp);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const runsByDate = groupByDate(runs);
		return Object.keys(runsByDate).map(date => ({
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
	readonly runs: readonly DuelsRun[];
}
