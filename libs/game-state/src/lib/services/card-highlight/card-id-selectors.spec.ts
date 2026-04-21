import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { cardIdSelector } from './card-id-selectors';

describe('cardIdSelector', () => {
	it("Nerub'ar Weblord highlights opposing battlecry minions", () => {
		const allCards: any = {
			getCard: (cardId: string) =>
				cardId === 'battlecry-minion'
					? { id: cardId, type: 'Minion', mechanics: [GameTag[GameTag.BATTLECRY]] }
					: { id: cardId, type: 'Minion', mechanics: [] },
		};
		const selector = cardIdSelector(CardIds.NerubarWeblord, null, null, 'player', allCards);
		expect(selector).toBeDefined();

		const deckCard = DeckCard.create({
			cardId: 'battlecry-minion',
			entityId: 42,
			internalEntityId: '42',
			zone: 'HAND',
		});
		const deckState = DeckState.create({ minionsDeadThisMatch: [] });
		const highlight = selector!({
			side: 'opponent',
			entityId: 42,
			internalEntityId: '42',
			cardId: deckCard.cardId,
			zone: 'hand',
			card: allCards.getCard(deckCard.cardId),
			deckState: deckState,
			deckCard: deckCard,
			allCards: allCards,
		} as any);
		expect(highlight).toBe(true);
	});
});
