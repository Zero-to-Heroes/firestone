import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsTreasureStatTypeFilterType } from '../../../../models/duels/duels-treasure-stat-type-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-passive-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsTreasurePassiveTypeOption implements DuelsDropdownOption {
	options: readonly TreasurePassiveTypeFilterOption[] = [
		{
			value: 'treasure-1',
			label: 'Treasures Pool 1',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'treasure-2',
			label: 'Treasures Pool 2',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'treasure-3',
			label: 'Treasures Pool 2 Ultra Rares only',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'passive-1',
			label: 'Passives Pool 1',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'passive-2',
			label: 'Passives Pool 2',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'passive-3',
			label: 'Passives Pool 2 Ultra Rares only',
		} as TreasurePassiveTypeFilterOption,
	] as readonly TreasurePassiveTypeFilterOption[];
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeTreasureStatTypeFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-treasures'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: TreasurePassiveTypeFilterOption) => {
		stateUpdater.next(new DuelsTreasurePassiveTypeFilterSelectedEvent(option.value));
	};
}

interface TreasurePassiveTypeFilterOption extends IOption {
	value: DuelsTreasureStatTypeFilterType;
}
