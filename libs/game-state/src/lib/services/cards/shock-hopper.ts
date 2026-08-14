/* eslint-disable no-mixed-spaces-and-tabs */
// Shock Hopper (YOG_524): 1 Mana 1/2 BEAST
// "[x]<b>Battlecry:</b> Get a random <b>Overload</b> card."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.OVERLOAD);

export const ShockHopper: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShockHopper_YOG_524],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShockHopper.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ShockHopper.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.OVERLOAD], possibleCards };
	},
};
