import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsViewPersonalDeckDetailsEvent } from '../../events/duels/duels-view-personal-deck-details-event';
import { Processor } from '../processor';

export class DuelsViewPersonalDeckDetailsProcessor implements Processor {
	public async process(
		event: DuelsViewPersonalDeckDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const deck = currentState.duels.personalDeckStats.find((stat) => stat.initialDeckList === event.deckstring);
		console.debug('deck', deck, currentState, event);
		const expandedRunIds: readonly string[] = [deck.runs[0].id];
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-personal-deck-details',
					selectedPersonalDeckstring: event.deckstring,
					selectedDeckId: undefined,
					menuDisplayType: 'breadcrumbs',
					expandedRunIds: expandedRunIds,
					treasureSearchString: null,
					heroSearchString: null,
				} as NavigationDuels),
				text: this.getDeckName(currentState, event.deckstring),
			} as NavigationState),
		];
	}

	private getDeckName(currentState: MainWindowState, deckstring: string): string {
		const deck = currentState?.duels?.personalDeckStats?.find((deck) => deck.initialDeckList === deckstring);
		// console.log('found deck', deck, currentState);
		return deck?.deckName;
	}
}
