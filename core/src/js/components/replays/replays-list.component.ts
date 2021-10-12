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
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { Preferences } from '../../models/preferences';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { arraysEqual } from '../../services/utils';

@Component({
	selector: 'replays-list',
	styleUrls: [`../../../css/component/replays/replays-list.component.scss`],
	template: `
		<div class="replays-container">
			<div class="filters">
				<replays-filter [state]="_state" [filterCategory]="'gameMode'"></replays-filter>
				<replays-filter
					[state]="_state"
					[filterCategory]="'deckstring'"
					*ngIf="!shouldHideDeckstringFilter"
				></replays-filter>
				<replays-filter
					[state]="_state"
					[filterCategory]="'bg-hero'"
					*ngIf="!shouldHideBgHeroFilter"
				></replays-filter>
				<replays-filter
					[state]="_state"
					[filterCategory]="'player-class'"
					*ngIf="!shouldHidePlayerClassFilter"
				></replays-filter>
				<replays-filter
					[state]="_state"
					[filterCategory]="'opponent-class'"
					*ngIf="!shouldHidePlayerClassFilter"
				></replays-filter>
				<replays-icon-toggle
					class="icon-toggle"
					[ngClass]="{ 'absolute': !shouldHidePlayerClassFilter }"
					[prefs]="_prefs"
				></replays-icon-toggle>
			</div>
			<infinite-scroll class="replays-list" (scrolled)="onScroll()" scrollable>
				<li *ngFor="let replay of displayedReplays">
					<grouped-replays [groupedReplays]="replay" [prefs]="_prefs"></grouped-replays>
				</li>
				<div class="loading" *ngIf="isLoading">Loading more replays...</div>
			</infinite-scroll>
			<section class="empty-state" *ngIf="!displayedReplays || displayedReplays.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_replays" />
						</svg>
					</i>
					<span class="title">Nothing here yet</span>
					<span class="subtitle">Play a match to get started</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListComponent implements AfterViewInit {
	@Input() set state(value: ReplaysState) {
		if (value.isLoading) {
			return;
		}

		const shouldHideDeckstringFilter = !['ranked', 'ranked-standard', 'ranked-wild', 'ranked-classic'].includes(
			value.getFilter('gameMode').selectedOption,
		);
		const shouldHideBgHeroFilter = !['battlegrounds'].includes(value.getFilter('gameMode').selectedOption);
		const shouldHidePlayerClassFilter = [null, 'battlegrounds', 'practice'].includes(
			value.getFilter('gameMode').selectedOption,
		);
		if (
			shouldHideDeckstringFilter === this.shouldHideDeckstringFilter &&
			shouldHideBgHeroFilter === this.shouldHideBgHeroFilter &&
			shouldHidePlayerClassFilter === this.shouldHidePlayerClassFilter &&
			arraysEqual(this._replays, value.groupedReplays ?? [])
		) {
			return;
		}

		this._state = value;
		this.shouldHidePlayerClassFilter = shouldHidePlayerClassFilter;
		this.shouldHideBgHeroFilter = shouldHideBgHeroFilter;
		this.shouldHideDeckstringFilter = shouldHideDeckstringFilter;
		this.displayedReplays = [];
		this._replays = value.groupedReplays || [];

		this.handleProgressiveDisplay(this._replays);
	}

	@Input() set prefs(value: Preferences) {
		if (!value || value === this.prefs) {
			return;
		}
		this._prefs = value;
	}

	displayedReplays: readonly GroupedReplays[] = [];
	_replays: readonly GroupedReplays[];
	_state: ReplaysState;
	_prefs: Preferences;
	isLoading: boolean;

	shouldHideDeckstringFilter: boolean;
	shouldHideBgHeroFilter: boolean;
	shouldHidePlayerClassFilter: boolean;

	private replaysIterator: IterableIterator<void>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackGroupedReplay(value: GroupedReplays, index: number) {
		return (value && value.replays && value.replays.length > 0 && value.replays[0].reviewId) || index;
	}

	onScroll() {
		this.replaysIterator && this.replaysIterator.next();
	}

	// We load the first replays, and load the rest only when the user scrolls down
	private handleProgressiveDisplay(replays: readonly GroupedReplays[]) {
		this.replaysIterator = this.buildIterator(replays);
		this.onScroll();
	}

	private *buildIterator(replays: readonly GroupedReplays[]): IterableIterator<void> {
		const workingReplays = [...replays];

		const step = 30;
		while (workingReplays.length > 0) {
			const currentReplays = [];
			while (
				workingReplays.length > 0 &&
				(currentReplays.length === 0 || this.getTotalReplaysLength(currentReplays) < step)
			) {
				currentReplays.push(...workingReplays.splice(0, 1));
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];

			this.isLoading = true;
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

	private getTotalReplaysLength(currentReplays: readonly GroupedReplays[]): number {
		if (!currentReplays || currentReplays.length === 0) {
			return 0;
		}
		return currentReplays.map((grouped) => grouped.replays).reduce((a, b) => a.concat(b), []).length;
	}
}
