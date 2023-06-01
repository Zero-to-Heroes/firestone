import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BinderState } from '../../../models/mainwindow/binder-state';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { Events } from '../../events.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { CollectionInitEvent } from './events/collection/collection-init-event';

@Injectable()
export class CollectionBootstrapService {
	constructor(
		private readonly events: Events,
		private readonly cardHistoryStorage: CardHistoryStorageService,
		private readonly collectionManager: CollectionManager,
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
	}

	private async init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.CollectionInit) {
				this.initCollectionState();
			}
		});

		await this.store.initComplete();
		this.initCollectionState();
	}

	private async initCollectionState(): Promise<void> {
		console.log('initializing collection state');
		// const [collection] = await Promise.all([
		// 	this.collectionManager.getCollection(),
		// 	// this.collectionManager.getBattlegroundsOwnedHeroSkinDbfIds(),
		// ]);
		const [cardHistory, totalHistoryLength, packStats] = await Promise.all([
			this.cardHistoryStorage.loadAll(100),
			this.cardHistoryStorage.countHistory(),
			// this.collectionManager.getCardBacks(),
			// this.collectionManager.getCoins(),
			this.collectionManager.getPackStats(),
		]);
		// const sets = await this.collectionManager.buildSets(collection);
		const newState = BinderState.create({
			// collection: collection as readonly Card[],
			// ownedBgsHeroSkins: ownedBgsHeroSkins as readonly number[],
			// packsFromMemory: packs as readonly PackInfo[],
			packStats: packStats,
			// allSets: sets,
			// cardBacks: cardBacks,
			// coins: coins,
			cardHistory: cardHistory,
			totalHistoryLength: totalHistoryLength,
			// isLoading: false,
		});
		console.log('collection loading card history');
		this.store.send(new CollectionInitEvent(newState));
	}
}
