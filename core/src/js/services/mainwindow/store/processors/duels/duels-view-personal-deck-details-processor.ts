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
		const firstRun = deck.runs?.length ? deck.runs[0] : null;
		const expandedRunIds: readonly string[] = !!firstRun ? [firstRun.id] : [];
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
				text: deck.deckName ?? 'Unnamed deck',
			} as NavigationState),
		];
	}
}
