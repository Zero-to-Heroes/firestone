import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { ConstructedDeckbuilderFormatSelectedEvent } from '../../events/decktracker/constructed-deckbuilder-format-selected-event';

export class ConstructedDeckbuilderFormatSelectedProcessor implements Processor {
	public async process(
		event: ConstructedDeckbuilderFormatSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
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
