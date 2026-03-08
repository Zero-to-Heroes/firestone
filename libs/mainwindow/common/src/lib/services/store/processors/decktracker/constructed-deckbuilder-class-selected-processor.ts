import { Processor } from '../processor';
import {
	ConstructedDeckbuilderClassSelectedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedDeckbuilderClassSelectedProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderClassSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
