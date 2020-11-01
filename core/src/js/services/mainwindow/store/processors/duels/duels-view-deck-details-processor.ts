import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { formatClass } from '../../../../utils';
import { DuelsViewDeckDetailsEvent } from '../../events/duels/duels-view-deck-details-event';
import { Processor } from '../processor';

export class DuelsViewDeckDetailsProcessor implements Processor {
	public async process(
		event: DuelsViewDeckDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-deck-details',
					selectedDeckId: event.deckId,
					menuDisplayType: 'breadcrumbs',
				} as NavigationDuels),
				text: this.getDeckName(currentState, event.deckId),
			} as NavigationState),
		];
	}

	private getDeckName(currentState: MainWindowState, deckId: number): string {
		const deck = currentState?.duels?.playerStats?.deckStats
			?.map(grouped => grouped.decks)
			?.reduce((a, b) => a.concat(b), [])
			?.find(deck => deck.id === deckId);
		console.log('found deck', deck, currentState);
		if (!deck) {
			return null;
		}
		const prefix = deck.wins ? `${deck.wins}-${deck.losses} ` : '';
		return prefix + formatClass(deck.playerClass);
	}
}
