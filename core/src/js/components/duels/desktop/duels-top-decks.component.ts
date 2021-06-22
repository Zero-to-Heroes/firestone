import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsDeckStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';

@Component({
	selector: 'duels-top-decks',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-top-decks.component.scss`,
	],
	template: `
		<div class="duels-runs-container">
			<infinite-scroll *ngIf="allDecks?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<duels-grouped-top-decks
					*ngFor="let stat of displayedDecks"
					[groupedDecks]="stat"
				></duels-grouped-top-decks>
				<div class="loading" *ngIf="isLoading">Loading more runs...</div>
			</infinite-scroll>
			<duels-empty-state *ngIf="!allDecks?.length"></duels-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTopDecksComponent {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.displayedDecks = [];
		this.updateValues();
	}

	allDecks: readonly DuelsGroupedDecks[];
	displayedDecks: readonly DuelsGroupedDecks[];
	isLoading: boolean;

	private iterator: IterableIterator<void>;
	private _state: DuelsState;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	onScroll() {
		this.iterator && this.iterator.next();
	}

	private updateValues() {
		if (!this._state?.playerStats) {
			return;
		}
		this.iterator = this.buildIterator();
		this.onScroll();
	}

	private *buildIterator(): IterableIterator<void> {
		this.allDecks = this._state.playerStats.deckStats
			.map((grouped) => this.applyFilters(grouped))
			.filter((grouped) => grouped.decks.length > 0);
		const workingRuns = [...this.allDecks];
		// One item is a full list of grouped replays for the day
		// So we don't want to be too aggressive with full runs
		const step = 1;
		const minShownReplays = 30;
		while (workingRuns.length > 0) {
			const currentRuns = [];
			while (
				workingRuns.length > 0 &&
				(currentRuns.length === 0 || this.getTotalRunsLength(currentRuns) < minShownReplays)
			) {
				currentRuns.push(...workingRuns.splice(0, 1));
			}
			this.displayedDecks = [...this.displayedDecks, ...currentRuns];
			this.isLoading = this.allDecks.length > step;
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

	private applyFilters(grouped: DuelsGroupedDecks): DuelsGroupedDecks {
		return {
			...grouped,
			decks: grouped.decks.filter((deck) => this.mmrFilter(deck, this._state.activeMmrFilter)),
		};
	}

	private mmrFilter(deck: DuelsDeckStat, activeMmrFilter: string): boolean {
		return !activeMmrFilter || activeMmrFilter === 'all' || deck.rating >= +activeMmrFilter;
	}

	private getTotalRunsLength(groups: readonly DuelsGroupedDecks[]): number {
		return groups ? groups.map((group) => group.decks).reduce((a, b) => a.concat(b), []).length : 0;
	}
}
