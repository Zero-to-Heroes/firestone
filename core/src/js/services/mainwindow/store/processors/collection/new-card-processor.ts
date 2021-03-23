import { Card } from '../../../../../models/card';
import { CardHistory } from '../../../../../models/card-history';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PityTimer } from '../../../../../models/pity-timer';
import { Set, SetCard } from '../../../../../models/set';
import { CardHistoryStorageService } from '../../../../collection/card-history-storage.service';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { IndexedDbService } from '../../../../collection/indexed-db.service';
import { PackHistoryService } from '../../../../collection/pack-history.service';
import { SetsService } from '../../../../collection/sets-service.service';
import { NewCardEvent } from '../../events/collection/new-card-event';
import { Processor } from '../processor';

// TODO: for now we just bruteforce rebuild the full collection on each new card event,
// which is highly unefficient. Maybe we should do things a little be smarter
export class NewCardProcessor implements Processor {
	constructor(
		private indexedDb: IndexedDbService,
		private collectionManager: CollectionManager,
		private cardHistoryStorage: CardHistoryStorageService,
		private pityTimer: PackHistoryService,
		private cards: SetsService,
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
		// console.debug('new cardHistory', cardHistory);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			allSets: await this.buildSetsFromCollection(collection),
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
