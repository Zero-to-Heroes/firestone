import { CardHistory } from '../../../../../models/card-history';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ToggleShowOnlyNewCardsInHistoryEvent } from '../../events/collection/toggle-show-only-new-cards-in-history-event';
import { Processor } from '../processor';

export class ToggleShowOnlyNewCardsInHistoryProcessor implements Processor {
	public async process(
		event: ToggleShowOnlyNewCardsInHistoryEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const showOnlyNewCardsInHistory = event.newValue;
		const shownHistory: readonly CardHistory[] = showOnlyNewCardsInHistory
			? currentState.binder.cardHistory.filter((card: CardHistory) => card.isNewCard)
			: currentState.binder.cardHistory;
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			showOnlyNewCardsInHistory: showOnlyNewCardsInHistory,
			shownCardHistory: shownHistory,
		} as BinderState);
		return Object.assign(new MainWindowState(), currentState, {
			binder: newBinder,
			isVisible: true,
		} as MainWindowState);
	}
}
