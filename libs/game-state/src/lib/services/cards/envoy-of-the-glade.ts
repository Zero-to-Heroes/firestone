/* eslint-disable no-mixed-spaces-and-tabs */
// Envoy of the Glade (EDR_873): 4 Mana 3/6
// "[x]<b>Battlecry:</b> Transform all Neutral cards in your deck into random Druid ones."

import { CardIds, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectClass(c, CardClass.DRUID);

export const EnvoyOfTheGlade: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EnvoyOfTheGlade_EDR_873],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(EnvoyOfTheGlade.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(EnvoyOfTheGlade.cardIds[0], input.allCards, isMatch, input.options);
		return { cardClasses: [CardClass.DRUID], possibleCards };
	},
};
