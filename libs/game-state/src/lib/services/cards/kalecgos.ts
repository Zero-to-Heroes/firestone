/* eslint-disable no-mixed-spaces-and-tabs */
// Kalecgos (CORE_DAL_609): 8 Mana 4/12 DRAGON
// "Your first spell each turn costs (0). <b>Battlecry:</b> <b>Discover</b> a spell."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const Kalecgos: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Kalecgos_CORE_DAL_609],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Kalecgos.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Kalecgos.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
