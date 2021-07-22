import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { ToggleShowHiddenDecksEvent } from '@services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/decktracker/main/filters/_decktracker-filters.component.scss`,
	],
	template: `
		<div class="filters decktracker-filters">
			<decktracker-format-filter-dropdown class="filter format-filter"></decktracker-format-filter-dropdown>
			<decktracker-rank-group-dropdown class="filter rank-group"></decktracker-rank-group-dropdown>
			<decktracker-time-filter-dropdown class="filter time-filter"></decktracker-time-filter-dropdown>
			<decktracker-rank-filter-dropdown class="filter rank-filter"></decktracker-rank-filter-dropdown>
			<decktracker-deck-sort-dropdown class="filter deck-sort"></decktracker-deck-sort-dropdown>

			<div
				class="filter-info"
				helpTooltip="Changing these filters will also impact the stats displayed in the decktracker in-game"
			>
				<svg>
					<use xlink:href="assets/svg/sprite.svg#info" />
				</svg>
			</div>
			<preference-toggle
				class="show-hidden-decks-link"
				*ngIf="showHiddenDecksLink$ | async"
				field="desktopDeckShowHiddenDecks"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent implements AfterViewInit {
	showHiddenDecksLink$: Observable<boolean>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.showHiddenDecksLink$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationDecktracker.currentView,
				([main, nav, prefs]) => prefs.desktopDeckHiddenDeckCodes,
			)
			.pipe(
				filter(([currentView, hiddenDeckCodes]) => !!currentView && !!hiddenDeckCodes),
				map(([currentView, hiddenDeckCodes]) => currentView !== 'deck-details' && hiddenDeckCodes.length > 0),
				tap((info) => cdLog('emitting hidden deck codes in ', this.constructor.name, info)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent(newValue));
	};
}
