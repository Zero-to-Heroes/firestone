/* eslint-disable no-mixed-spaces-and-tabs */
// Faceless Enigma (TIME_860): 2 Mana 2/2
// "[x]<b>Battlecry:</b> Look at 2 random <b>Secrets</b>. Pick one to cast for yourself. The other casts for your opponent."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.SECRET);

export const FacelessEnigma: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FacelessEnigma_TIME_860],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FacelessEnigma.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(FacelessEnigma.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.SECRET], possibleCards };
	},
};
