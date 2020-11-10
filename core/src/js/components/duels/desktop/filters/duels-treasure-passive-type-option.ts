import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsTreasurePassiveTypeFilterType } from '../../../../models/duels/duels-treasure-passive-type-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-passive-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsTreasurePassiveTypeOption implements DuelsDropdownOption {
	options: readonly TreasurePassiveTypeFilterOption[] = [
		{
			value: 'treasure',
			label: 'Treasures',
		} as TreasurePassiveTypeFilterOption,
		{
			value: 'passive',
			label: 'Passives',
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
	value: DuelsTreasurePassiveTypeFilterType;
}
