import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DuelsClassFilterType } from '../../../models/duels/duels-class-filter.type';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsDeckStat } from '../../../models/duels/duels-player-stats';
import { DuelsTimeFilterType } from '../../../models/duels/duels-time-filter.type';
import { DuelsTopDecksDustFilterType } from '../../../models/duels/duels-top-decks-dust-filter.type';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { getDuelsMmrFilterNumber } from '../../../services/ui-store/duels-ui-helper';

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
					*ngFor="let stat of displayedGroupedDecks"
					[groupedDecks]="stat"
				></duels-grouped-top-decks>
				<div class="loading" *ngIf="isLoading">Loading more runs...</div>
			</infinite-scroll>
			<duels-empty-state *ngIf="!allDecks?.length"></duels-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTopDecksComponent implements OnDestroy {
	isLoading: boolean;
	allDecks: readonly DuelsGroupedDecks[];
	displayedGroupedDecks: readonly DuelsGroupedDecks[];

	private sub$$: Subscription;
	private iterator: IterableIterator<void>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreService) {
		this.sub$$ = this.store
			.listen$(
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch?.number,
			)
			.pipe(
				filter(
					([topDecks, mmrPercentiles, mmrFilter, classFilter, timeFilter, dustFilter, lastPatchNumber]) =>
						!!topDecks?.length && !!mmrPercentiles?.length,
				),
				map(([topDecks, mmrPercentiles, mmrFilter, classFilter, timeFilter, dustFilter, lastPatchNumber]) =>
					topDecks
						.map((deck) =>
							this.applyFilters(
								deck,
								getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter),
								classFilter,
								timeFilter,
								dustFilter,
								lastPatchNumber,
							),
						)
						.filter((group) => group.decks.length > 0),
				),
				tap((stat) => cdLog('emitting top decks in ', this.constructor.name, stat)),
			)
			.subscribe((topDecks) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedGroupedDecks = [];
					// One item is a full list of grouped replays for the day
					// So we don't want to be too aggressive with full runs
					this.iterator = this.buildIterator(topDecks, 4);
					// console.debug('gamesIterator', this.gamesIterator);
					this.onScroll();
				});
			});
	}

	ngOnDestroy() {
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.iterator && this.iterator.next();
	}

	private *buildIterator(topDecks: readonly DuelsGroupedDecks[], step = 10): IterableIterator<void> {
		this.allDecks = topDecks;
		const workingRuns = [...this.allDecks];
		const minShownReplays = 30;
		while (workingRuns.length > 0) {
			const currentRuns = [];
			while (
				workingRuns.length > 0 &&
				(currentRuns.length === 0 || this.getTotalRunsLength(currentRuns) < minShownReplays)
			) {
				currentRuns.push(...workingRuns.splice(0, 1));
			}
			this.displayedGroupedDecks = [...this.displayedGroupedDecks, ...currentRuns];
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

	private applyFilters(
		grouped: DuelsGroupedDecks,
		mmrFilter: number,
		classFilter: DuelsClassFilterType,
		timeFilter: DuelsTimeFilterType,
		dustFilter: DuelsTopDecksDustFilterType,
		lastPatchNumber: number,
	): DuelsGroupedDecks {
		return {
			...grouped,
			decks: grouped.decks
				.filter((deck) => this.mmrFilter(deck, mmrFilter))
				.filter((deck) => this.classFilter(deck, classFilter))
				.filter((deck) => this.timeFilter(deck, timeFilter, lastPatchNumber))
				.filter((deck) => this.dustFilter(deck, dustFilter)),
		};
	}

	private mmrFilter(deck: DuelsDeckStat, filter: number): boolean {
		return !filter || deck.rating >= filter;
	}

	private classFilter(deck: DuelsDeckStat, filter: DuelsClassFilterType): boolean {
		return !filter || filter === 'all' || deck.playerClass === filter;
	}

	private dustFilter(deck: DuelsDeckStat, filter: DuelsTopDecksDustFilterType): boolean {
		return (
			!filter ||
			filter === 'all' ||
			(filter === '1000' && deck.dustCost <= 1000) ||
			(filter === '0' && deck.dustCost === 0)
		);
	}

	private timeFilter(deck: DuelsDeckStat, filter: DuelsTimeFilterType, lastPatchNumber: number): boolean {
		if (!filter) {
			return true;
		}
		switch (filter) {
			case 'all-time':
				return true;
			case 'last-patch':
				return deck.buildNumber === lastPatchNumber;
			case 'past-seven':
				return new Date(deck.periodStart) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			case 'past-three':
				return new Date(deck.periodStart) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
		}
	}

	private getTotalRunsLength(groups: readonly DuelsGroupedDecks[]): number {
		return groups ? groups.map((group) => group.decks).reduce((a, b) => a.concat(b), []).length : 0;
	}
}
