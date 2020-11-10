import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsTopDecksDustFilterType } from '../../../../models/duels/duels-top-decks-dust-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTopDecksDustFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-dust-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsTopDecksDustFilterOption implements DuelsDropdownOption {
	options: readonly TopDeckDustFilterOption[] = [
		{
			value: 'all',
			label: 'All decks',
		} as TopDeckDustFilterOption,
		{
			value: '0',
			label: 'Own all cards',
		} as TopDeckDustFilterOption,
		{
			value: '1000',
			label: '1000 dust',
		} as TopDeckDustFilterOption,
	] as readonly TopDeckDustFilterOption[];
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeTopDecksDustFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-top-decks'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: TopDeckDustFilterOption) => {
		stateUpdater.next(new DuelsTopDecksDustFilterSelectedEvent(option.value));
	};
}

interface TopDeckDustFilterOption extends IOption {
	value: DuelsTopDecksDustFilterType;
}
