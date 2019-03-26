import { MainWindowStoreEvent } from "../main-window-store-event";

export class ShowCardDetailsEvent implements MainWindowStoreEvent {
    readonly cardId: string;

    constructor(cardId: string) {
        this.cardId = cardId;
    }

    // private async pickSet(collaborators: CollaboratorsService, allSets: ReadonlyArray<Set>, cardId: string): Promise<Set> {
	// 	const collection = await collaborators.collectionManager.getCollection();
	// 	console.log('building set from', cardId);
	// 	const set = collaborators.cards.getSetFromCardId(cardId);
	// 	console.log('base set is', set);
	// 	const pityTimer = await collaborators.pityTimer.getPityTimer(set.id);
	// 	const mergedSet = this.mergeSet(collection, set, pityTimer);
	// 	return mergedSet;
    // }

    // private mergeSet(collection: Card[], set: Set, pityTimer: PityTimer): Set {
	// 	const updatedCards: SetCard[] = this.mergeFullCards(collection, set.allCards);
	// 	const ownedLimitCollectibleCards = updatedCards
	// 		.map((card: SetCard) => card.getNumberCollected())
	// 		.reduce((c1, c2) => c1 + c2, 0);
	// 	const ownedLimitCollectiblePremiumCards = updatedCards
	// 		.map((card: SetCard) => card.getNumberCollectedPremium())
	// 		.reduce((c1, c2) => c1 + c2, 0);
	// 	return new Set(
	// 		set.id,
	// 		set.name,
	// 		set.standard,
	// 		updatedCards,
	// 		pityTimer,
	// 		ownedLimitCollectibleCards,
	// 		ownedLimitCollectiblePremiumCards);
    // }
    
    // private mergeFullCards(collection: Card[], setCards: ReadonlyArray<SetCard>): SetCard[] {
	// 	return setCards.map((card: SetCard) => {
	// 		const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
	// 		const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
	// 		const ownedNonPremium = collectionCard ? collectionCard.count : 0;
	// 		return new SetCard(card.id, card.name, card.cardClass, card.rarity, card.cost, ownedNonPremium, ownedPremium);
	// 	});
	// }
}