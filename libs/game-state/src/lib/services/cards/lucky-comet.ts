/* eslint-disable no-mixed-spaces-and-tabs */
// Lucky Comet (GDB_873): 2 Mana
// "<b>Discover</b> a <b>Combo</b> minion. The next one you play triggers its <b>Combo</b> twice."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.COMBO) && canBeDiscoveredByClass(c, currentClass);

export const LuckyComet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LuckyComet_GDB_873],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			LuckyComet.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			LuckyComet.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.COMBO], possibleCards };
	},
};
