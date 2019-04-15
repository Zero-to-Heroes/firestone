import { DeckCard } from "../../../models/decktracker/deck-card";

export class DeckManipulationHelper {

    public static removeSingleCardFromZone(zone: ReadonlyArray<DeckCard>, cardId: string): ReadonlyArray<DeckCard> {
        return zone
                .map((card: DeckCard) => card.cardId === cardId 
                        ? DeckManipulationHelper.removeSingleCard(card) 
                        : card)
                .filter((card) => card);
    }

	public static addSingleCardToZone(zone: ReadonlyArray<DeckCard>, cardTemplate: DeckCard): ReadonlyArray<DeckCard> {
        // console.log('adding single card to zone', zone, cardTemplate);
        // console.log('got it with filter', zone.filter((card) => card.cardId === cardTemplate.cardId));
        // console.log('got it with find', zone.find((card) => card.cardId === cardTemplate.cardId));
        let inZone = zone.find((card) => card.cardId === cardTemplate.cardId);
        // console.log('is in zone?', inZone);
        // If we don't know what card it is, we don't want to group them together
        if (!inZone || cardTemplate.cardId === null) {
            const result = [
                ...zone, 
                Object.assign(new DeckCard(), {
                    cardId: cardTemplate.cardId,
                    cardName: cardTemplate.cardName,
                    manaCost: cardTemplate.manaCost,
                    rarity: cardTemplate.rarity,
                    totalQuantity: 1,
                    zone: cardTemplate.zone,
                } as DeckCard)
            ];
            // console.log('returning', result);
            return result;
        }
        else {
            // console.log('in zone', zone);
            return zone.map((card) => card.cardId === cardTemplate.cardId 
                    ? DeckManipulationHelper.addSingleCard(card) 
                    : card);
        }
	}
    
	private static removeSingleCard(card: DeckCard): DeckCard {
		if (card.totalQuantity == 1) {
			return null;
		}
		return Object.assign(new DeckCard(), card, {
			totalQuantity: card.totalQuantity - 1,
		});
	}
	
	private static addSingleCard(card: DeckCard): DeckCard {
		return Object.assign(new DeckCard(), card, {
			totalQuantity: card.totalQuantity + 1,
		});
	}
}