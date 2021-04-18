import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsTimeFilterType } from '../../../../models/duels/duels-time-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { formatPatch } from '../../../../services/utils';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsTimeSortFilterOption implements DuelsDropdownOption {
	optionsBuilder = (navigation: NavigationState, state: MainWindowState): readonly TimeFilterOption[] => {
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
			{
				value: 'past-seven',
				label: 'Past 7 days',
			} as TimeFilterOption,
			{
				value: 'past-three',
				label: 'Past 3 days',
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
	};
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) => state.duels?.activeTimeFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			(navigation.navigationDuels.selectedCategoryId === 'duels-stats' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-runs' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-personal-decks' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-personal-deck-details' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-top-decks' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-treasures')
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: TimeFilterOption) => {
		stateUpdater.next(new DuelsTimeFilterSelectedEvent(option.value));
	};
}

interface TimeFilterOption extends IOption {
	value: DuelsTimeFilterType;
}
