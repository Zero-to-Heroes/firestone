import { CardHistory } from '../../../../../models/card-history';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CardHistoryStorageService } from '../../../../collection/card-history-storage.service';
import { LoadMoreCardHistoryEvent } from '../../events/collection/load-more-card-history-event';
import { Processor } from '../processor';

export class LoadMoreCardHistoryProcessor implements Processor {
	constructor(private cardHistoryStorage: CardHistoryStorageService) {}

	public async process(
		event: LoadMoreCardHistoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const result = await this.cardHistoryStorage.loadAll(0);
		const cardHistory: readonly CardHistory[] = [...result].splice(0, event.maxResults);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			cardHistory: cardHistory,
		} as BinderState);
		return [
			currentState.update({
				binder: newBinder,
			} as MainWindowState),
			null,
		];
	}
}
