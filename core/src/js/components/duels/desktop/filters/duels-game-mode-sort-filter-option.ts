import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsGameModeFilterType } from '../../../../models/duels/duels-game-mode-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsGameModeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-game-mode-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsGameModeSortFilterOption implements DuelsDropdownOption {
	optionsBuilder = (navigation: NavigationState, state: MainWindowState): readonly GameModeFilterOption[] => {
		return [
			{
				value: 'all',
				label: 'All modes',
				tooltip:
					'Community stats are only available for Heroic. Your own stats will show both Casual and Heroic.',
			} as GameModeFilterOption,
			{
				value: 'duels',
				label: `Casual`,
				tooltip: 'Community stats are only available for Heroic. Your own stats will only show Casual.',
			} as GameModeFilterOption,
			{
				value: 'paid-duels',
				label: `Heroic`,
			} as GameModeFilterOption,
		] as readonly GameModeFilterOption[];
	};
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeGameModeFilter;
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
				navigation.navigationDuels.selectedCategoryId === 'duels-personal-deck-details')
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: GameModeFilterOption) => {
		stateUpdater.next(new DuelsGameModeFilterSelectedEvent(option.value));
	};
}

interface GameModeFilterOption extends IOption {
	value: DuelsGameModeFilterType;
	tooltip?: string;
}
