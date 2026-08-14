/* eslint-disable no-mixed-spaces-and-tabs */
// Chittering Tunneler (UNG_835): 2 Mana 2/2 BEAST
// "[x]<b>Battlecry:</b> <b>Discover</b> a spell. Deal damage to your hero equal to its Cost."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const ChitteringTunneler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ChitteringTunneler],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ChitteringTunneler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ChitteringTunneler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
