import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';

export interface DuelsDropdownOption {
	options?: readonly IOption[];
	optionsBuilder?: (navigation: NavigationState, state: MainWindowState) => readonly IOption[];
	activeFilterHandler: (state: MainWindowState) => string;
	visibleHandler: (navigation: NavigationState, state: MainWindowState) => boolean;
	selectHandler: (stateUpdater: EventEmitter<MainWindowStoreEvent>, selectedOption: IOption) => void;
}
