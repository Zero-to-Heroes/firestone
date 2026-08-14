/* eslint-disable no-mixed-spaces-and-tabs */
// Time-Lost Protodrake (TTN_715): 4 Mana 4/5 DRAGON
// "[x]<b>Taunt</b> When you draw this, add a random Dragon to your hand."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

export const TimeLostProtodrake: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TimeLostProtodrake],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TimeLostProtodrake.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TimeLostProtodrake.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
