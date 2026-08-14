/* eslint-disable no-mixed-spaces-and-tabs */
// Pack Kodo (BAR_030): 3 Mana 3/3 BEAST
// "<b>Battlecry:</b> <b>Discover</b> a Beast, <b>Secret</b>, or weapon."

import { CardIds, CardType, GameTag, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	((hasCorrectTribe(c, Race.BEAST) && hasCorrectType(c, CardType.MINION)) ||
		(hasCorrectType(c, CardType.SPELL) && c?.mechanics?.includes(GameTag[GameTag.SECRET])) ||
		hasCorrectType(c, CardType.WEAPON)) &&
	canBeDiscoveredByClass(c, currentClass);

export const PackKodo: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PackKodo],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PackKodo.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PackKodo.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { possibleCards };
	},
};
