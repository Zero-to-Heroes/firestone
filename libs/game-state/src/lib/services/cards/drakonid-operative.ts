/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Drakonid Operative (CFM_605 / CORE_CFM_605)
// 5 mana 5/6 Dragon Priest Minion
// "Battlecry: If you're holding a Dragon, Discover a copy of a card in your opponent's deck."

export const DrakonidOperative: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DrakonidOperative, CardIds.DrakonidOperativeCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.opponentDeckState.deck
			.map((c) => c.cardId)
			.filter((c) => !!c)
			.filter((c, index, self) => self.indexOf(c) === index);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck
			.map((c) => c.cardId)
			.filter((c) => !!c)
			.filter((c, index, self) => self.indexOf(c) === index);
		return {
			possibleCards: possibleCards,
		};
	},
};
