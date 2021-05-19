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
import { DeckRankFilterType } from '../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { ChangeDeckFormatFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';
import { ChangeDeckModeFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-mode-filter-event';
import { ChangeDeckRankFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-rank-filter-event';
import { ChangeDeckSortEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-sort-event';
import { ChangeDeckTimeFilterEvent } from '../../../services/mainwindow/store/events/decktracker/change-deck-time-filter-event';
import { ToggleShowHiddenDecksEvent } from '../../../services/mainwindow/store/events/decktracker/toggle-show-hidden-decks-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { formatPatch } from '../../../services/utils';

@Component({
	selector: 'decktracker-filters',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/filters.scss`,
		`../../../../css/component/decktracker/main/decktracker-filters.component.scss`,
	],
	template: `
		<div class="filters decktracker-filters" *ngIf="anyVisible()">
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
				class="rank"
				[options]="rankOptions"
				[filter]="activeRank"
				[checkVisibleHandler]="rankVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectRank($event)"
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
				*ngIf="showHiddenDecksLink"
				field="desktopDeckShowHiddenDecks"
				label="Show archived"
				[toggleFunction]="toggleShowHiddenDecks"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerFiltersComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		// console.log('setting state', value);
		this.buildTimeOptions();
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	formatFilterOptions: readonly FormatFilterOption[] = [
		{
			value: 'all',
			label: 'All formats',
		} as FormatFilterOption,
		{
			value: 'standard',
			label: 'Standard',
		} as FormatFilterOption,
		{
			value: 'wild',
			label: 'Wild',
		} as FormatFilterOption,
		{
			value: 'classic',
			label: 'Classic',
		} as FormatFilterOption,
	] as readonly FormatFilterOption[];
	activeFormatFilter: StatGameFormatType;
	formatVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'decktracker' &&
			navigation.navigationDecktracker.currentView !== 'deck-details'
		);
	};

	timeFilterOptions: readonly TimeFilterOption[] = [];
	activeTimeFilter: DeckTimeFilterType;
	timeVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return state && navigation && navigation.currentApp == 'decktracker';
	};

	rankOptions: readonly DeckRankOption[] = [
		{
			value: 'all',
			label: 'All ranks',
		} as DeckRankOption,
		{
			value: 'silver',
			label: 'Silver+',
		} as DeckRankOption,
		{
			value: 'gold',
			label: 'Gold+',
		} as DeckRankOption,
		{
			value: 'platinum',
			label: 'Platinum+',
		} as DeckRankOption,
		{
			value: 'diamond',
			label: 'Diamond+',
		} as DeckRankOption,
		{
			value: 'legend',
			label: 'Legend',
		} as DeckRankOption,
		{
			value: 'legend-500',
			label: 'Top 500',
		} as DeckRankOption,
	] as readonly DeckRankOption[];
	activeRank: DeckRankFilterType;
	rankVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
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
		return (
			state &&
			navigation &&
			navigation.currentApp == 'decktracker' &&
			!['deck-details', 'ladder-stats'].includes(navigation.navigationDecktracker.currentView)
		);
	};

	_state: MainWindowState;
	_navigation: NavigationState;
	showHiddenDecksLink: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

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

	selectRank(option: DeckRankOption) {
		this.stateUpdater.next(new ChangeDeckRankFilterEvent(option.value));
	}

	toggleShowHiddenDecks = (newValue: boolean) => {
		this.stateUpdater.next(new ToggleShowHiddenDecksEvent(newValue));
		// console.log('roggle function called');
	};

	anyVisible(): boolean {
		return (
			this.formatVisibleHandler(this._navigation, this._state) ||
			this.timeVisibleHandler(this._navigation, this._state) ||
			this.rankVisibleHandler(this._navigation, this._state) ||
			this.sortVisibleHandler(this._navigation, this._state)
		);
	}

	private buildTimeOptions() {
		this.timeFilterOptions = [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'season-start',
				label: 'This season',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: 'Last patch',
				tooltip: formatPatch(this._state?.decktracker?.patch),
			} as TimeFilterOption,
			{
				value: 'past-30',
				label: 'Past 30 days',
			} as TimeFilterOption,
			{
				value: 'past-7',
				label: 'Past 7 days',
			} as TimeFilterOption,
			{
				value: 'past-1',
				label: 'Past day',
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
	}

	private async doSetValues() {
		this.activeFormatFilter = this._state?.decktracker?.filters?.gameFormat;
		this.activeTimeFilter = this._state?.decktracker?.filters?.time;
		this.activeSort = this._state?.decktracker?.filters?.sort;
		this.activeRank = this._state?.decktracker?.filters?.rank;

		const prefs = await this.prefs.getPreferences();
		this.showHiddenDecksLink =
			this._state &&
			prefs.desktopDeckHiddenDeckCodes &&
			prefs.desktopDeckHiddenDeckCodes.length > 0 &&
			this._navigation &&
			this._navigation.currentApp == 'decktracker' &&
			this._navigation.navigationDecktracker.currentView !== 'deck-details';
		// console.log('showHiddenDecksList', this.showHiddenDecksLink, prefs.desktopDeckHiddenDeckCodes);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}

// interface ModeFilterOption extends IOption {
// 	value: StatGameModeType;
// }

interface TimeFilterOption extends IOption {
	value: DeckTimeFilterType;
}

interface DeckSortOption extends IOption {
	value: DeckSortType;
}

interface DeckRankOption extends IOption {
	value: DeckRankFilterType;
}
