/* eslint-disable no-mixed-spaces-and-tabs */
// Shifty Sophomore (SCH_234): 4 Mana 4/4
// "<b>Stealth</b> <b>Spellburst:</b> Add a <b>Combo</b> card to your hand."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.COMBO);

export const ShiftySophomore: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShiftySophomore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShiftySophomore.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ShiftySophomore.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.COMBO], possibleCards };
	},
};
