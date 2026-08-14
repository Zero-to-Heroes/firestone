/* eslint-disable no-mixed-spaces-and-tabs */
// Mothership (SC_762): 12 Mana 10/10 MECH
// "[x]<b>Taunt</b> <b>Battlecry and Deathrattle:</b> Get two random Protoss minions."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.PROTOSS);

export const MothershipSc: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Mothership_SC_762],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MothershipSc.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MothershipSc.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.PROTOSS], possibleCards };
	},
};
