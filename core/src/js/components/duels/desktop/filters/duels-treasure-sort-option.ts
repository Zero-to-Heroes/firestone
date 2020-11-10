import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsTreasureSortFilterType } from '../../../../models/duels/duels-treasure-sort-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTreasureSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsTreasureSortOption implements DuelsDropdownOption {
	options: readonly TreasureSortFilterOption[] = [
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
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeTreasureSortFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-treasures'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: TreasureSortFilterOption) => {
		stateUpdater.next(new DuelsTreasureSortFilterSelectedEvent(option.value));
	};
}

interface TreasureSortFilterOption extends IOption {
	value: DuelsTreasureSortFilterType;
}
