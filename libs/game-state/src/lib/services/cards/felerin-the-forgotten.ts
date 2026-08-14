/* eslint-disable no-mixed-spaces-and-tabs */
// Felerin, the Forgotten (RLK_215): 4 Mana 3/3
// "[x]<b>Battlecry:</b> Add a random <b>Outcast</b> card to the left and right sides of your hand. They cost (2) less."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.OUTCAST);

export const FelerinTheForgotten: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FelerinTheForgotten],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FelerinTheForgotten.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(FelerinTheForgotten.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.OUTCAST], possibleCards };
	},
};
