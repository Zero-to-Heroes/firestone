import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Processor } from '../processor';

export class DuelsCurrentDeckProcessor implements Processor {
	public async process(
		event: DuelsCurrentDeckEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				duels: currentState.duels.update({
					currentDuelsDeck: event.deck,
				}),
			}),
			null,
		];
	}
}
