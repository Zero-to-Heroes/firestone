import { Processor } from '../processor';
import {
	ConstructedDeckbuilderFormatSelectedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ConstructedDeckbuilderFormatSelectedProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderFormatSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [
			currentState.update({
				decktracker: currentState.decktracker.update({
					deckbuilder: currentState.decktracker.deckbuilder.update({
						currentFormat: event.format,
					}),
				}),
			}),
			null,
		];
	}
}
