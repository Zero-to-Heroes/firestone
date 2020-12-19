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

@Component({
	selector: 'duels-runs-list',
	styleUrls: [`../../../../css/component/duels/desktop/duels-runs-list.component.scss`],
	template: `
		<div class="duels-runs-container">
			<infinite-scroll *ngIf="allRuns?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let run of displayedRuns">
					<duels-run [run]="run" [displayLoot]="displayLoot" [isExpanded]="isExpanded(run.id)"></duels-run>
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
		this.handleProgressiveDisplay();
	}

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		this.displayedRuns = [];
		this.handleProgressiveDisplay();
	}

	@Input() set navigation(value: NavigationDuels) {
		this.expandedRunIds = value.expandedRunIds || [];
		this.displayedRuns = [];
		this.handleProgressiveDisplay();
	}

	@Input() displayLoot = true;

	displayedRuns: readonly DuelsRun[] = [];
	allRuns: readonly DuelsRun[] = [];
	_state: DuelsState;
	_navigation: NavigationDuels;
	_deckstring: string;
	isLoading: boolean;
	expandedRunIds: readonly string[] = [];

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

	private getTotalRunsLength(currentReplays: readonly DuelsRun[]): number {
		return currentReplays ? currentReplays.length : 0;
	}
}
