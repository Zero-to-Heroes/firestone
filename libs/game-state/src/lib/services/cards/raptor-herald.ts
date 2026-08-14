/* eslint-disable no-mixed-spaces-and-tabs */
// Raptor Herald (CORE_EDR_004 / CORE_EDR_004_2026): 3 Mana 4/2 BEAST
// "[x]<b>Rewind</b> <b>Battlecry:</b> <b>Discover</b> a Beast with a <b>Dark Gift</b>. <b>Kindred:</b> It costs (1) less."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && canBeDiscoveredByClass(c, currentClass);

export const RaptorHerald: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RaptorHerald_CORE_EDR_004, CardIds.RaptorHerald_CORE_EDR_004_2026],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RaptorHerald.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RaptorHerald.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
