/* eslint-disable no-mixed-spaces-and-tabs */
// Resonance Coil (SC_760): 3 Mana
// "Deal $5 damage to a minion. Get a random Protoss spell."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.PROTOSS);

export const ResonanceCoil: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ResonanceCoil_SC_760],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ResonanceCoil.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ResonanceCoil.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, mechanics: [GameTag.PROTOSS], possibleCards };
	},
};
