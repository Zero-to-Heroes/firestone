import { EventEmitter, Injectable } from '@angular/core';
import { Card } from '../../../models/card';
import { BinderState } from '../../../models/mainwindow/binder-state';
import { PityTimer } from '../../../models/pity-timer';
import { Set, SetCard } from '../../../models/set';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { PackHistoryService } from '../../collection/pack-history.service';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { SetsService } from '../../sets-service.service';
import { CollectionInitEvent } from './events/collection/collection-init-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';

@Injectable()
export class CollectionBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly cardHistoryStorage: CardHistoryStorageService,
		private readonly collectionManager: CollectionManager,
		private readonly pityTimer: PackHistoryService,
		private readonly cards: SetsService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_COLLECTION_STATE).subscribe(event => this.initCollectionState());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initCollectionState(): Promise<BinderState> {
		console.log('initializing collection state');
		const [cardHistory, sets, totalHistoryLength] = await Promise.all([
			this.cardHistoryStorage.loadAll(100),
			this.buildSets(),
			this.cardHistoryStorage.countHistory(),
		]);
		const newState = Object.assign(new BinderState(), {
			allSets: sets,
			cardHistory: cardHistory,
			// shownCardHistory: cardHistory,
			totalHistoryLength: totalHistoryLength,
			isLoading: false,
		} as BinderState);
		console.warn('collection loading card history');
		this.stateUpdater.next(new CollectionInitEvent(newState));
		return newState;
	}

	private async buildSets(): Promise<readonly Set[]> {
		const collection = await this.collectionManager.getCollection();
		return this.buildSetsFromCollection(collection);
	}

	private async buildSetsFromCollection(collection: Card[]): Promise<readonly Set[]> {
		const pityTimers = await this.pityTimer.getPityTimers();
		return this.cards
			.getAllSets()
			.map(set => ({ set: set, pityTimer: pityTimers.filter(timer => timer.setId === set.id)[0] }))
			.map(set => this.mergeSet(collection, set.set, set.pityTimer));
	}

	private mergeSet(collection: Card[], set: Set, pityTimer: PityTimer): Set {
		const updatedCards: SetCard[] = this.mergeFullCards(collection, set.allCards);
		const ownedLimitCollectibleCards = updatedCards
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
		const ownedLimitCollectiblePremiumCards = updatedCards
			.map((card: SetCard) => card.getNumberCollectedPremium())
			.reduce((c1, c2) => c1 + c2, 0);
		// if (set.id === 'core') {
		// 	console.log('building basics', set, updatedCards, ownedLimitCollectibleCards, collection);
		// }
		return new Set(
			set.id,
			set.name,
			set.standard,
			updatedCards,
			pityTimer,
			ownedLimitCollectibleCards,
			ownedLimitCollectiblePremiumCards,
		);
	}

	private mergeFullCards(collection: Card[], setCards: readonly SetCard[]): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
			const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
			const ownedNonPremium = collectionCard ? collectionCard.count : 0;
			return new SetCard(
				card.id,
				card.name,
				card.cardClass,
				card.rarity,
				card.cost,
				ownedNonPremium,
				ownedPremium,
			);
		});
	}
}
