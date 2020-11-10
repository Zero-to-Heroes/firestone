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
import { DuelsClassFilterType } from '../../../../models/duels/duels-class-filter.type';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { DuelsTimeFilterType } from '../../../../models/duels/duels-time-filter.type';
import { DuelsTreasurePassiveTypeFilterType } from '../../../../models/duels/duels-treasure-passive-type-filter.type';
import { DuelsTreasureSortFilterType } from '../../../../models/duels/duels-treasure-sort-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { classes, formatClass } from '../../../../services/hs-utils';
import { DuelsStatTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-stat-type-filter-selected-event';
import { DuelsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { DuelsTopDecksClassFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-class-filter-selected-event';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-passive-type-filter-selected-event';
import { DuelsTreasureSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { formatPatch } from '../../../../services/utils';
import { DuelsDropdownOption } from './duels-dropdown-option';
import { DuelsHeroFilterOption } from './duels-hero-filter-option';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/duels-filters.component.scss`,
	],
	template: `
		<div class="duels-filters" *ngIf="anyVisible()">
			<duels-filter-dropdown
				class="hero-sort-filter"
				[option]="heroOption"
				[state]="_state"
				[navigation]="_navigation"
			></duels-filter-dropdown>
			<fs-filter-dropdown
				class="stat-type-filter"
				[options]="statTypeFilterOptions"
				[filter]="activeStatTypeFilter"
				[checkVisibleHandler]="statTypeVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectStatTypeFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="treasure-passive-type-filter"
				[options]="treasurePassiveTypeFilterOptions"
				[filter]="activeTreasurePassiveTypeFilter"
				[checkVisibleHandler]="treasurePassiveVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTreasurePassiveTypeFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="treasure-sort-filter"
				[options]="treasureSortFilterOptions"
				[filter]="activeTreasureSortFilter"
				[checkVisibleHandler]="treasureVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTreasureSortFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="time-sort-filter"
				[optionsBuilder]="timeOptionsBuilder"
				[filter]="activeTimeFilter"
				[checkVisibleHandler]="timeVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTimeFilter($event)"
			></fs-filter-dropdown>
			<fs-filter-dropdown
				class="top-decks-class-filter"
				[options]="topDecksClassFilterOptions"
				[filter]="activeTopDecksClassFilter"
				[checkVisibleHandler]="topDecksClassVisibleHandler"
				[state]="_state"
				[navigation]="_navigation"
				(onOptionSelected)="selectTopDecksClassFilter($event)"
			></fs-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;

	heroOption: DuelsDropdownOption;

	statTypeFilterOptions: readonly StatTypeFilterOption[] = [
		{
			value: 'hero',
			label: 'Heroes',
		} as StatTypeFilterOption,
		{
			value: 'hero-power',
			label: 'Hero Powers',
		} as StatTypeFilterOption,
		{
			value: 'signature-treasure',
			label: 'Signature Treasures',
		} as StatTypeFilterOption,
	] as readonly StatTypeFilterOption[];
	activeStatTypeFilter: DuelsStatTypeFilterType;
	statTypeFilterVisible: boolean;
	statTypeVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-stats'
		);
	};

	treasurePassiveTypeFilterOptions: readonly TreasurePassiveTypeFilterOption[] = [
		{
			value: 'treasure',
			label: 'Treasures',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'passive',
			label: 'Passives',
		} as TreasurePassiveTypeFilterOption,
	] as readonly TreasurePassiveTypeFilterOption[];
	activeTreasurePassiveTypeFilter: DuelsTreasurePassiveTypeFilterType;
	treasurePassiveTypeFilterVisible: boolean;
	treasurePassiveVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-treasures'
		);
	};

	treasureSortFilterOptions: readonly TreasureSortFilterOption[] = [
		{
			value: 'global-winrate',
			label: 'Global winrate',
		} as TreasureSortFilterOption,
		{
			value: 'global-pickrate',
			label: 'Global pick rate',
		} as TreasureSortFilterOption,
		{
			value: 'global-offering',
			label: 'Global offering',
		} as TreasureSortFilterOption,
		{
			value: 'player-pickrate',
			label: 'Your pick rate',
		} as TreasureSortFilterOption,
	] as readonly TreasureSortFilterOption[];
	activeTreasureSortFilter: DuelsTreasureSortFilterType;
	treasureSortFilterVisible: boolean;
	treasureVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-treasures'
		);
	};

	timeOptionsBuilder = (navigation: NavigationState, state: MainWindowState): readonly TimeFilterOption[] => {
		return [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: `Last patch`,
				tooltip: formatPatch(state?.duels?.currentDuelsMetaPatch),
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
	};
	activeTimeFilter: DuelsTimeFilterType;
	timeFilterVisible: boolean;
	timeVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			(navigation.navigationDuels.selectedCategoryId === 'duels-stats' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-treasures')
		);
	};

	topDecksClassFilterOptions: readonly TopDeckClassFilterOption[] = this.buildTopDeckClassFilterOptions();
	activeTopDecksClassFilter: DuelsClassFilterType;
	topDecksClassFilterVisible: boolean;
	topDecksClassVisibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-top-decks'
		);
	};

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectStatTypeFilter(option: StatTypeFilterOption) {
		this.stateUpdater.next(new DuelsStatTypeFilterSelectedEvent(option.value));
	}

	selectTreasureSortFilter(option: TreasureSortFilterOption) {
		this.stateUpdater.next(new DuelsTreasureSortFilterSelectedEvent(option.value));
	}

	selectTreasurePassiveTypeFilter(option: TreasurePassiveTypeFilterOption) {
		this.stateUpdater.next(new DuelsTreasurePassiveTypeFilterSelectedEvent(option.value));
	}

	selectTimeFilter(option: TimeFilterOption) {
		this.stateUpdater.next(new DuelsTimeFilterSelectedEvent(option.value));
	}

	selectTopDecksClassFilter(option: TopDeckClassFilterOption) {
		this.stateUpdater.next(new DuelsTopDecksClassFilterSelectedEvent(option.value));
	}

	anyVisible() {
		return (
			this.heroOption.visibleHandler(this._navigation, this._state) ||
			this.statTypeVisibleHandler(this._navigation, this._state) ||
			this.treasureVisibleHandler(this._navigation, this._state) ||
			this.treasurePassiveVisibleHandler(this._navigation, this._state) ||
			this.timeVisibleHandler(this._navigation, this._state) ||
			this.topDecksClassVisibleHandler(this._navigation, this._state)
		);
	}

	private doSetValues() {
		if (!this._state || !this._navigation) {
			return;
		}
		this.heroOption = new DuelsHeroFilterOption();

		this.activeStatTypeFilter = this._state.duels?.activeStatTypeFilter;
		this.activeTreasureSortFilter = this._state.duels?.activeTreasureSortFilter;
		this.activeTreasurePassiveTypeFilter = this._state.duels?.activeTreasureStatTypeFilter;
		this.activeTimeFilter = this._state.duels?.activeTimeFilter;
		this.activeTopDecksClassFilter = this._state.duels?.activeTopDecksClassFilter;
	}

	private buildTopDeckClassFilterOptions(): readonly TopDeckClassFilterOption[] {
		const options: readonly DuelsClassFilterType[] = ['all', ...(classes as DuelsClassFilterType[])];
		return options.map(
			option =>
				({
					value: option,
					label: option === 'all' ? 'All classes' : formatClass(option),
				} as TopDeckClassFilterOption),
		);
	}
}

interface StatTypeFilterOption extends IOption {
	value: DuelsStatTypeFilterType;
}

interface TreasureSortFilterOption extends IOption {
	value: DuelsTreasureSortFilterType;
}

interface TreasurePassiveTypeFilterOption extends IOption {
	value: DuelsTreasurePassiveTypeFilterType;
}

interface TimeFilterOption extends IOption {
	value: DuelsTimeFilterType;
}

interface TopDeckClassFilterOption extends IOption {
	value: DuelsClassFilterType;
}
