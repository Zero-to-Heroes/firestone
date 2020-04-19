import { CardHistory } from '../../../../../models/card-history';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ToggleShowOnlyNewCardsInHistoryEvent } from '../../events/collection/toggle-show-only-new-cards-in-history-event';
import { Processor } from '../processor';

export class ToggleShowOnlyNewCardsInHistoryProcessor implements Processor {
	public async process(
		event: ToggleShowOnlyNewCardsInHistoryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const showOnlyNewCardsInHistory = event.newValue;
		const shownHistory: readonly CardHistory[] = showOnlyNewCardsInHistory
			? currentState.binder.cardHistory.filter((card: CardHistory) => card.isNewCard)
			: currentState.binder.cardHistory;
		const newCollection = navigationState.navigationCollection.update({
			showOnlyNewCardsInHistory: showOnlyNewCardsInHistory,
			shownCardHistory: shownHistory,
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}
}
