// Mind Eater (RLK_845)
// 2-mana 3/2 Priest Undead Minion
// Deathrattle: Add a copy of a card in your opponent's deck to your hand.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const MindEater: GeneratingCard = {
	cardIds: [CardIds.MindEater],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
