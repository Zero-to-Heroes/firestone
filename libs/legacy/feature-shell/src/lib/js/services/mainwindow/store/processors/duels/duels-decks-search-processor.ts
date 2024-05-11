import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsDecksSearchEvent } from '../../events/duels/duels-decks-search-event';
import { Processor } from '../processor';

export class DuelsDecksSearchProcessor implements Processor {
	public async process(
		event: DuelsDecksSearchEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				duels: currentState.duels.update({
					decksSearchString: event.value,
				}),
			}),
			null,
		];
	}
}
