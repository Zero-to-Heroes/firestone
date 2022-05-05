import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderSelectTabEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-select-tab-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderSelectTabProcessor implements Processor {
	public async process(
		event: DuelsDeckbuilderSelectTabEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentTab: event.tab,
					}),
				}),
			}),
			null,
		];
	}
}
