/* eslint-disable no-mixed-spaces-and-tabs */
// Eroded Sediment (WW_428): 3 Mana 4/3 ELEMENTAL
// "[x]<b>Battlecry:</b> If you played an Elemental last turn, <b>Discover</b> any Elemental from the past."

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectTribe(c, Race.ELEMENTAL);

export const ErodedSediment: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ErodedSediment_WW_428],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(ErodedSediment.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(ErodedSediment.cardIds[0], input.allCards, isMatch, input.options);
		return { races: [Race.ELEMENTAL], possibleCards };
	},
};
