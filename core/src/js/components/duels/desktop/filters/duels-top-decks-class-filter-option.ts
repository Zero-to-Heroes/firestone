import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsClassFilterType } from '../../../../models/duels/duels-class-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { classes, formatClass } from '../../../../services/hs-utils';
import { DuelsTopDecksClassFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-class-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsClassFilterOption implements DuelsDropdownOption {
	options: readonly TopDeckClassFilterOption[] = this.buildTopDeckClassFilterOptions();
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeTopDecksClassFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			(navigation.navigationDuels.selectedCategoryId === 'duels-stats' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-runs' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-treasures' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-personal-decks' ||
				// navigation.navigationDuels.selectedCategoryId === 'duels-personal-deck-details' ||
				navigation.navigationDuels.selectedCategoryId === 'duels-top-decks')
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: TopDeckClassFilterOption) => {
		stateUpdater.next(new DuelsTopDecksClassFilterSelectedEvent(option.value));
	};

	private buildTopDeckClassFilterOptions(): readonly TopDeckClassFilterOption[] {
		const options: readonly DuelsClassFilterType[] = ['all', ...(classes as DuelsClassFilterType[])];
		return options.map(
			(option) =>
				({
					value: option,
					label: option === 'all' ? 'All classes' : formatClass(option),
				} as TopDeckClassFilterOption),
		);
	}
}

interface TopDeckClassFilterOption extends IOption {
	value: DuelsClassFilterType;
}
