/* eslint-disable no-mixed-spaces-and-tabs */
// Botface (TOY_906): 7 Mana 4/12 MECH
// "[x]<b>Taunt</b> After this takes damage, get two random <b>Minis</b>."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.MINI);

export const Botface: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Botface_TOY_906],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Botface.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Botface.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.MINI], possibleCards };
	},
};
