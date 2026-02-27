import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Twisted Webweaver (EDR_540)
// Summons copies of minions you played this game.
export const TwistedWebweaver: StaticGeneratingCard = {
	cardIds: [CardIds.TwistedWebweaver_EDR_540],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const playedCardIds = input.inputOptions.deckState.cardsPlayedThisMatch
			.filter((c) => input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.MINION])
			.map((c) => c.cardId)
			.filter((c) => !!c);
		return [...new Set(playedCardIds)];
	},
};
