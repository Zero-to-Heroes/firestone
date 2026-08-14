/* eslint-disable no-mixed-spaces-and-tabs */
// Selenic Drake (EDR_462): 4 Mana 3/6 DRAGON
// "[x]<b>Elusive</b> At the end of your turn, get a random Dragon."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

export const SelenicDrake: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SelenicDrake_EDR_462],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SelenicDrake.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SelenicDrake.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
