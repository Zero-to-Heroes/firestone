/* eslint-disable no-mixed-spaces-and-tabs */
// Frightened Flunky (ULD_195 / CORE_ULD_195): 2 Mana 2/3
// "<b>Taunt</b> <b>Battlecry:</b> <b>Discover</b> a <b>Taunt</b> minion."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const FrightenedFlunky: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FrightenedFlunky, CardIds.FrightenedFlunkyCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FrightenedFlunky.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			FrightenedFlunky.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
