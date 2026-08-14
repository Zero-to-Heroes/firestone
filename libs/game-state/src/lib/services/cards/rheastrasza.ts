/* eslint-disable no-mixed-spaces-and-tabs */
// Rheastrasza (WW_824): 8 Mana 8/8 DRAGON
// "[x]<b>Battlecry:</b> If your deck started with no duplicates, summon the Purified Dragon Nest."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && canBeDiscoveredByClass(c, currentClass);

export const Rheastrasza: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Rheastrasza_WW_824],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Rheastrasza.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Rheastrasza.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
