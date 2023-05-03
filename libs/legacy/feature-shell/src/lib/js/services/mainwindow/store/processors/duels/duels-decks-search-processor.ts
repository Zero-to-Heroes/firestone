import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsDecksSearchEvent } from '../../events/duels/duels-decks-search-event';
import { Processor } from '../processor';

declare let amplitude;

export class DuelsDecksSearchProcessor implements Processor {
	public async process(
		event: DuelsDecksSearchEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		if (event.value?.length) {
			amplitude.getInstance().logEvent('search', {
				page: 'duels-decks',
			});
		}
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
