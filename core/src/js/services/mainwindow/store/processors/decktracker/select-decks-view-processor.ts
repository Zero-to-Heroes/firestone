import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { SelectDecksViewEvent } from '../../events/decktracker/select-decks-view-event';
import { Processor } from '../processor';

export class SelectDeckViewProcessor implements Processor {
	public async process(event: SelectDecksViewEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			currentView: event.newView,
		} as DecktrackerState);
		return Object.assign(new MainWindowState(), currentState, {
			decktracker: newState,
		} as MainWindowState);
	}
}
