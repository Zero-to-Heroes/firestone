import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { ChangeDeckFormatFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';
import { ChangeDeckModeFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-mode-filter-event';
import { ChangeDeckSortEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-sort-event';
import { ChangeDeckTimeFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-time-filter-event';
import { ToggleShowHiddenDecksEvent } from '../../../services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-filters.component.scss`,
	],
	template: `
		<div class="decktracker-filters">
			<fs-filter-dropdown
				class="format-filter"
				[options]="formatFilterOptions"
				[filter]="activeFormatFilter"
				[checkVisibleHandler]="formatVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectFormat($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="time-filter"
				[options]="timeFilterOptions"
				[filter]="activeTimeFilter"
				[checkVisibleHandler]="timeVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTime($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="sort"
				[options]="sortOptions"
				[filter]="activeSort"
				[checkVisibleHandler]="sortVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectSort($event)"
			></fs-filter-dropdown>
			<div class="show-hidden-decks-link" (click)="toggleShowHiddenDecks()">
				{{ _state.decktracker.showHiddenDecks ? 'Showing archived decks' : 'Hiding archived decks' }}
			</div>
			<!-- <fs-filter-dropdown
				class="mode-filter"
				[options]="modeFilterOptions"
				[filter]="activeModeFilter"
				[checkVisibleHandler]="modeVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectModeFilter($event)"
			></fs-filter-dropdown> -->
			<!-- <fs-filter-dropdown
				class="class-filter"
				[options]="classFilterOptions"
				[filter]="activeClassFilter"
				[checkVisibleHandler]="classVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectClassFilter($event)"
			></fs-filter-dropdown> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		console.log('setting state', value);
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;

	formatFilterOptions: readonly FormatFilterOption[] = [
		{
			value: 'standard',
			label: 'Standard',
		} as FormatFilterOption,
		{
			value: 'wild',
			label: 'Wild',
		} as FormatFilterOption,
	] as readonly FormatFilterOption[];
	activeFormatFilter: StatGameFormatType;
	formatVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return state && navigation && navigation.currentApp == 'decktracker';
	};

	timeFilterOptions: readonly TimeFilterOption[] = [
		{
			value: 'all-time',
			label: 'All time',
		} as TimeFilterOption,
		{
			value: 'season-start',
			label: 'This season',
		} as TimeFilterOption,
	] as readonly TimeFilterOption[];
	activeTimeFilter: DeckTimeFilterType;
	timeVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return state && navigation && navigation.currentApp == 'decktracker';
	};

	sortOptions: readonly DeckSortOption[] = [
		{
			value: 'last-played',
			label: 'Last used',
		} as DeckSortOption,
		{
			value: 'games-played',
			label: 'Games played',
		} as DeckSortOption,
		{
			value: 'winrate',
			label: 'Winrate',
		} as DeckSortOption,
	] as readonly DeckSortOption[];
	activeSort: DeckSortType;
	sortVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return state && navigation && navigation.currentApp == 'decktracker';
	};

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectFormat(option: FormatFilterOption) {
		this.stateUpdater.next(new ChangeDeckFormatFilterEvent(option.value));
	}

	selectTime(option: TimeFilterOption) {
		this.stateUpdater.next(new ChangeDeckTimeFilterEvent(option.value));
	}

	selectMode(option: FormatFilterOption) {
		this.stateUpdater.next(new ChangeDeckModeFilterEvent());
	}

	selectSort(option: DeckSortOption) {
		this.stateUpdater.next(new ChangeDeckSortEvent(option.value));
	}

	toggleShowHiddenDecks() {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent());
	}

	private doSetValues() {
		this.activeFormatFilter = this._state?.decktracker?.filters?.gameFormat;
		this.activeTimeFilter = this._state?.decktracker?.filters?.time;
		this.activeSort = this._state?.decktracker?.filters?.sort;
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}

interface ModeFilterOption extends IOption {
	value: StatGameModeType;
}

interface TimeFilterOption extends IOption {
	value: DeckTimeFilterType;
}

interface DeckSortOption extends IOption {
	value: DeckSortType;
}
