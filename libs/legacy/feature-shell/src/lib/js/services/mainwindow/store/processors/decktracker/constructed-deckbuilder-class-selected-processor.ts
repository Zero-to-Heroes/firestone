import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderClassSelectedEvent } from '@firestone/mainwindow/common';

export class ConstructedDeckbuilderClassSelectedProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderClassSelectedEvent,
		currentState: MainWindowState,
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
