import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { CardHistory } from '../../../../../models/card-history';
import { LoadMoreCardHistoryEvent } from '../../events/collection/load-more-card-history-event';
import { CardHistoryStorageService } from '../../../../collection/card-history-storage.service';

export class LoadMoreCardHistoryProcessor implements Processor {
	constructor(private cardHistoryStorage: CardHistoryStorageService) {}

	public async process(event: LoadMoreCardHistoryEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const result = await this.cardHistoryStorage.loadAll(0);
		const cardHistory: readonly CardHistory[] = result.splice(0, event.maxResults);
		const shownHistory: readonly CardHistory[] = currentState.binder.showOnlyNewCardsInHistory
			? cardHistory.filter((card: CardHistory) => card.isNewCard)
			: cardHistory;
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			cardHistory: cardHistory,
			shownCardHistory: shownHistory,
		} as BinderState);
		return Object.assign(new MainWindowState(), currentState, {
			binder: newBinder,
			isVisible: true,
		} as MainWindowState);
	}
}
