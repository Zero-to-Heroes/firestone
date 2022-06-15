import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderClassSelectedEvent } from '../../events/decktracker/constructed-deckbuilder-class-selected-event';

export class ConstructedDeckbuilderClassSelectedProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderClassSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				decktracker: currentState.decktracker.update({
					deckbuilder: currentState.decktracker.deckbuilder.update({
						currentClass: event.playerClass,
					}),
				}),
			}),
			null,
		];
	}
}
