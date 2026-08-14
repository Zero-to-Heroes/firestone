/* eslint-disable no-mixed-spaces-and-tabs */
// Calamity's Grasp (NX2_025): 1 Mana 1/undefined
// "<b>Deathrattle:</b> Add a random <b>Outcast</b> card to your hand."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.OUTCAST);

export const CalamitysGrasp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CalamitysGrasp],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CalamitysGrasp.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(CalamitysGrasp.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.OUTCAST], possibleCards };
	},
};
