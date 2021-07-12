import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';

// The generic approach looks cool, but the main issue is that it needs to depend
// on the whole state to be able to handle all option types, and so is not really
// working well with the idea of having components that depend on minimal state
// into
export interface DuelsDropdownOption {
	options?: readonly IOption[];
	optionsBuilder?: (navigation: NavigationState, state: MainWindowState) => readonly IOption[];
	activeFilterHandler: (state: MainWindowState) => string;
	visibleHandler: (navigation: NavigationState, state: MainWindowState) => boolean;
	selectHandler: (stateUpdater: EventEmitter<MainWindowStoreEvent>, selectedOption: IOption) => void;
}
