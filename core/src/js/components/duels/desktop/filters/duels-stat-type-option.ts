import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStatTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-stat-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsStatTypeOption implements DuelsDropdownOption {
	options: readonly StatTypeFilterOption[] = [
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
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeStatTypeFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-stats'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: StatTypeFilterOption) => {
		stateUpdater.next(new DuelsStatTypeFilterSelectedEvent(option.value));
	};
}

interface StatTypeFilterOption extends IOption {
	value: DuelsStatTypeFilterType;
}
