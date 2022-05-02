import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsDeckbuilderHeroPowerSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-power-selected-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsDeckbuilderHeroPowerSelectedProcessor implements Processor {
	public async process(
		event: DuelsDeckbuilderHeroPowerSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const heroPowerCardId = event.heroPowerCardId;
		return [
			currentState.update({
				duels: currentState.duels.update({
					deckbuilder: currentState.duels.deckbuilder.update({
						currentHeroPowerCardId: heroPowerCardId,
					}),
				}),
			}),
			null,
		];
	}
}
