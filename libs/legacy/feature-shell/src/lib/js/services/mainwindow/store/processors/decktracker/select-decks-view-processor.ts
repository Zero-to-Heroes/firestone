import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectDecksViewEvent } from '../../events/decktracker/select-decks-view-event';
import { Processor } from '../processor';

export class SelectDeckViewProcessor implements Processor {
	public async process(
		event: SelectDecksViewEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newDecktracker = navigationState.navigationDecktracker.update({
			currentView: event.newView,
			menuDisplayType: 'menu',
		} as NavigationDecktracker);
		return [
			null,
			navigationState.update({
				navigationDecktracker: newDecktracker,
			} as NavigationState),
		];
	}
}
