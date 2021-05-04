import { EventEmitter, Injectable } from '@angular/core';
import { Card } from '../../../models/card';
import { PackInfo } from '../../../models/collection/pack-info';
import { BinderState } from '../../../models/mainwindow/binder-state';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { SetsService } from '../../collection/sets-service.service';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { CollectionInitEvent } from './events/collection/collection-init-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';

@Injectable()
export class CollectionBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly cardHistoryStorage: CardHistoryStorageService,
		private readonly collectionManager: CollectionManager,
		private readonly cards: SetsService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_COLLECTION_STATE).subscribe((event) => this.initCollectionState());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initCollectionState(): Promise<BinderState> {
		console.log('initializing collection state');
		const [collection, packs] = await Promise.all([
			this.collectionManager.getCollection(),
			this.collectionManager.getPacks(),
		]);
		const [cardHistory, totalHistoryLength, cardBacks, coins, packStats] = await Promise.all([
			this.cardHistoryStorage.loadAll(100),
			this.cardHistoryStorage.countHistory(),
			this.collectionManager.getCardBacks(),
			this.collectionManager.getCoins(),
			this.collectionManager.getPackStats(),
		]);
		const sets = await this.collectionManager.buildSets(collection, packStats);
		const newState = Object.assign(new BinderState(), {
			collection: collection as readonly Card[],
			packs: packs as readonly PackInfo[],
			packStats: packStats,
			allSets: sets,
			cardBacks: cardBacks,
			coins: coins,
			cardHistory: cardHistory,
			totalHistoryLength: totalHistoryLength,
			isLoading: false,
		} as BinderState);
		console.log('collection loading card history');
		this.stateUpdater.next(new CollectionInitEvent(newState));
		return newState;
	}
}
