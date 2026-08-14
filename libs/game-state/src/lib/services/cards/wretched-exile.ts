/* eslint-disable no-mixed-spaces-and-tabs */
// Wretched Exile (RLK_210): 2 Mana 2/3
// "[x]After you play an <b>Outcast</b> card, add a random <b>Outcast</b> card to your hand."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.OUTCAST);

export const WretchedExile: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WretchedExile],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WretchedExile.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WretchedExile.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.OUTCAST], possibleCards };
	},
};
