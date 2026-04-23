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

	it('Phoenix Egg highlights Fire spells in hand', () => {
		const allCards: any = {
			getCard: (cardId: string) =>
				cardId === 'fire-spell'
					? { id: cardId, type: 'Spell', spellSchool: 'FIRE' }
					: { id: cardId, type: 'Spell', spellSchool: 'FROST' },
		};
		const selector = cardIdSelector(CardIds.Thoribelore_PhoenixEggToken_RLK_604t, null, null, 'player', allCards);
		expect(selector).toBeDefined();

		const fireSpell = DeckCard.create({
			cardId: 'fire-spell',
			entityId: 43,
			internalEntityId: '43',
			zone: 'HAND',
		});
		const deckState = DeckState.create({ minionsDeadThisMatch: [] });
		const highlight = selector!({
			side: 'player',
			entityId: 43,
			internalEntityId: '43',
			cardId: fireSpell.cardId,
			zone: 'hand',
			card: allCards.getCard(fireSpell.cardId),
			deckState: deckState,
			deckCard: fireSpell,
			allCards: allCards,
		} as any);
		expect(highlight).toBe(true);
	});

	it('Phoenix Egg does not highlight non-Fire spells in hand', () => {
		const allCards: any = {
			getCard: (cardId: string) =>
				cardId === 'fire-spell'
					? { id: cardId, type: 'Spell', spellSchool: 'FIRE' }
					: { id: cardId, type: 'Spell', spellSchool: 'FROST' },
		};
		const selector = cardIdSelector(CardIds.Thoribelore_PhoenixEggToken_RLK_604t, null, null, 'player', allCards);
		expect(selector).toBeDefined();

		const frostSpell = DeckCard.create({
			cardId: 'frost-spell',
			entityId: 44,
			internalEntityId: '44',
			zone: 'HAND',
		});
		const deckState = DeckState.create({ minionsDeadThisMatch: [] });
		const highlight = selector!({
			side: 'player',
			entityId: 44,
			internalEntityId: '44',
			cardId: frostSpell.cardId,
			zone: 'hand',
			card: allCards.getCard(frostSpell.cardId),
			deckState: deckState,
			deckCard: frostSpell,
			allCards: allCards,
		} as any);
		expect(highlight).toBe(false);
	});
});
