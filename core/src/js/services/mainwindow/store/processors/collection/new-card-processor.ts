import { Card } from '../../../../../models/card';
import { CardHistory } from '../../../../../models/card-history';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CardHistoryStorageService } from '../../../../collection/card-history-storage.service';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { IndexedDbService } from '../../../../collection/indexed-db.service';
import { NewCardEvent } from '../../events/collection/new-card-event';
import { Processor } from '../processor';

// TODO: for now we just bruteforce rebuild the full collection on each new card event,
// which is highly unefficient. Maybe we should do things a little be smarter
export class NewCardProcessor implements Processor {
	constructor(
		private indexedDb: IndexedDbService,
		private collectionManager: CollectionManager,
		private cardHistoryStorage: CardHistoryStorageService,
	) {}

	public async process(
		event: NewCardEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('receiving new card history', event);
		const collection: readonly Card[] = await this.collectionManager.getCollection();
		if (collection && collection.length > 0) {
			await this.indexedDb.saveCollection(collection);
		}
		const history = event.isDust
			? new CardHistory(event.cardId, event.type === 'GOLDEN', false, -1)
			: new CardHistory(event.cardId, event.type === 'GOLDEN', true, event.newCount);
		this.cardHistoryStorage.newHistory(history);
		const cardHistory = [history, ...currentState.binder.cardHistory] as readonly CardHistory[];
		const sets = await this.collectionManager.buildSets(collection, currentState.binder.packStats);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			allSets: sets,
			collection: collection,
			cardHistory: cardHistory,
		} as BinderState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				binder: newBinder,
			} as MainWindowState),
			null,
		];
	}
}
