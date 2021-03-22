import { EventEmitter, Injectable } from '@angular/core';
import { Card } from '../../../models/card';
import { PackInfo } from '../../../models/collection/pack-info';
import { BinderState } from '../../../models/mainwindow/binder-state';
import { PityTimer } from '../../../models/pity-timer';
import { Set, SetCard } from '../../../models/set';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { PackHistoryService } from '../../collection/pack-history.service';
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
		const [collection, packs] = await Promise.all([
			this.collectionManager.getCollection(),
			this.collectionManager.getPacks(),
		]);
		const [cardHistory, sets, totalHistoryLength, cardBacks, coins, packStats] = await Promise.all([
			this.cardHistoryStorage.loadAll(100),
			this.buildSets(collection),
			this.cardHistoryStorage.countHistory(),
			this.collectionManager.getCardBacks(),
			this.collectionManager.getCoins(),
			this.collectionManager.getPackStats(),
		]);
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

	private async buildSets(collection: readonly Card[]): Promise<readonly Set[]> {
		return this.buildSetsFromCollection(collection);
	}

	private async buildSetsFromCollection(collection: readonly Card[]): Promise<readonly Set[]> {
		const pityTimers = await this.pityTimer.getPityTimers();
		return this.cards
			.getAllSets()
			.map(set => ({ set: set, pityTimer: pityTimers.filter(timer => timer.setId === set.id)[0] }))
			.map(set => this.mergeSet(collection, set.set, set.pityTimer));
	}

	private mergeSet(collection: readonly Card[], set: Set, pityTimer: PityTimer): Set {
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
			set.launchDate,
			set.standard,
			updatedCards,
			pityTimer,
			ownedLimitCollectibleCards,
			ownedLimitCollectiblePremiumCards,
		);
	}

	private mergeFullCards(collection: readonly Card[], setCards: readonly SetCard[]): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
			const ownedNonPremium = collectionCard ? collectionCard.count : 0;
			const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
			const ownedDiamond = collectionCard ? collectionCard.diamondCount : 0;
			return new SetCard(
				card.id,
				card.name,
				card.cardClass,
				card.rarity,
				card.cost,
				ownedNonPremium,
				ownedPremium,
				ownedDiamond,
			);
		});
	}
}
