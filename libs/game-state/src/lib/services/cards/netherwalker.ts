/* eslint-disable no-mixed-spaces-and-tabs */
// Netherwalker (BT_321 / CORE_BT_321): 2 Mana 2/2
// "<b>Battlecry:</b> <b>Discover</b> a Demon."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, currentClass);

export const Netherwalker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Netherwalker, CardIds.Netherwalker_CORE_BT_321],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Netherwalker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Netherwalker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
