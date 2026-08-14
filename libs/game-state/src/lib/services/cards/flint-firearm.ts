/* eslint-disable no-mixed-spaces-and-tabs */
// Flint Firearm (WW_379): 2 Mana 2/3
// "[x]<b>Battlecry:</b> Get a random <b>Quickdraw</b> card. If you play it this turn, repeat this."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.QUICKDRAW);

export const FlintFirearm: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FlintFirearm_WW_379],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FlintFirearm.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(FlintFirearm.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.QUICKDRAW], possibleCards };
	},
};
