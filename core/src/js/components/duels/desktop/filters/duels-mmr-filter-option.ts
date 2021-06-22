import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsMmrFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-mmr-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsMmrFilterOption implements DuelsDropdownOption {
	options: readonly RankFilterOption[] = [
		{
			value: 'all',
			label: 'All ranks',
		} as RankFilterOption,
		{
			value: '4000',
			label: '4,000+',
		} as RankFilterOption,
		{
			value: '6000',
			label: '6,000+',
		} as RankFilterOption,
		{
			value: '8000',
			label: '8,000+',
		} as RankFilterOption,
		{
			value: '10000',
			label: '10,000+',
		} as RankFilterOption,
	] as readonly RankFilterOption[];
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) => state.duels?.activeMmrFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-top-decks'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: RankFilterOption) => {
		stateUpdater.next(new DuelsMmrFilterSelectedEvent(option.value));
	};
}

interface RankFilterOption extends IOption {
	value: 'all' | string;
}
