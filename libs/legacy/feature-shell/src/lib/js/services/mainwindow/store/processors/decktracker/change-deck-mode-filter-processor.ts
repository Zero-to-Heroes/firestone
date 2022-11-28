import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ChangeDeckModeFilterEvent } from '../../events/decktracker/change-deck-mode-filter-event';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	public async process(
		event: ChangeDeckModeFilterEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
	}
}
