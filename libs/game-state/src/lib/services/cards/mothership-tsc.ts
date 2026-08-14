/* eslint-disable no-mixed-spaces-and-tabs */
// Stormcoil Mothership (TSC_645): 6 Mana 5/4 MECH
// "<b>Rush</b> <b>Deathrattle:</b> Summon two random Mechs that cost (3) or less."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH) && hasCost(c, '<=', 3);

export const MothershipTsc: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Mothership_TSC_645],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MothershipTsc.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MothershipTsc.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MECH], possibleCards };
	},
};
