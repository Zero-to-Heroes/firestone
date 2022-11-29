import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedMetaDecksLoadedEvent } from '../../events/decktracker/constructed-meta-decks-loaded-event';

export class ConstructedMetaDecksLoadedProcessor implements Processor {
	public async process(
		event: ConstructedMetaDecksLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			decktracker: currentState.decktracker.update({
				metaDecks: event.decks,
			}),
		});
		return [newState, null];
	}
}
