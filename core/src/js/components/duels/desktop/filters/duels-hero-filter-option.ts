import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { DuelsHeroSortFilterType } from '../../../../models/duels/duels-hero-sort-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsHeroSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { DuelsDropdownOption } from './duels-dropdown-option';

export class DuelsHeroFilterOption implements DuelsDropdownOption {
	options: readonly HeroSortFilterOption[] = [
		{
			value: 'player-winrate',
			label: 'Your winrate',
		} as HeroSortFilterOption,
		{
			value: 'global-winrate',
			label: 'Global winrate',
		} as HeroSortFilterOption,
		{
			value: 'games-played',
			label: 'Games played',
		} as HeroSortFilterOption,
	] as readonly HeroSortFilterOption[];
	activeFilterHandler: (state: MainWindowState) => string = (state: MainWindowState) =>
		state.duels?.activeHeroSortFilter;
	visibleHandler = (navigation: NavigationState, state: MainWindowState): boolean => {
		return (
			state &&
			navigation &&
			navigation.currentApp == 'duels' &&
			navigation.navigationDuels &&
			navigation.navigationDuels.selectedCategoryId === 'duels-stats'
		);
	};
	selectHandler = (stateUpdater: EventEmitter<MainWindowStoreEvent>, option: HeroSortFilterOption) => {
		stateUpdater.next(new DuelsHeroSortFilterSelectedEvent(option.value));
	};
}

interface HeroSortFilterOption extends IOption {
	value: DuelsHeroSortFilterType;
}
