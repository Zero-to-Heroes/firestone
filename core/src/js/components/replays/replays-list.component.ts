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
		// console.log('[replays-list] setting state', value);
		if (value.isLoading) {
			return;
		}
		this._state = value;
		this.shouldHideDeckstringFilter = !['ranked', 'ranked-standard', 'ranked-wild', 'ranked-classic'].includes(
			this._state.getFilter('gameMode').selectedOption,
		);
		this.shouldHideBgHeroFilter = !['battlegrounds'].includes(this._state.getFilter('gameMode').selectedOption);
		this.shouldHidePlayerClassFilter = [null, 'battlegrounds', 'practice'].includes(
			this._state.getFilter('gameMode').selectedOption,
		);
		this.displayedReplays = [];
		this._replays = value.groupedReplays || [];
		this.handleProgressiveDisplay();
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
		// console.log('[replays-list]', 'arrived at the end of display, loading more elements');
		this.replaysIterator && this.replaysIterator.next();
	}

	// We load the first replays, and load the rest only when the user scrolls down
	private handleProgressiveDisplay() {
		// console.log('[replays-list] handleProgressiveDisplay');
		this.replaysIterator = this.buildIterator();
		this.onScroll();
		// console.log('[replays-list] handleProgressiveDisplay done');
	}

	private *buildIterator(): IterableIterator<void> {
		// console.log('[replays-list]', 'starting loading replays');
		const workingReplays = [...this._replays];
		// console.log('[replays-list] workingReplays', workingReplays);
		const step = 100;
		while (workingReplays.length > 0) {
			const currentReplays = [];
			while (
				workingReplays.length > 0 &&
				(currentReplays.length === 0 || this.getTotalReplaysLength(currentReplays) < step)
			) {
				currentReplays.push(...workingReplays.splice(0, 1));
				// console.log('[replays-list] currentReplays', currentReplays);
			}
			this.displayedReplays = [...this.displayedReplays, ...currentReplays];
			// console.log('[replays-list] displayedReplays', this.displayedReplays, workingReplays);
			this.isLoading = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			// console.log(
			// 	'[replays-list]',
			// 	'loaded replays',
			// 	this.displayedReplays,
			// 	this.getTotalReplaysLength(this.displayedReplays),
			// );
			yield;
		}
		this.isLoading = false;
		// console.log('[replays-list] everything loaded');
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
