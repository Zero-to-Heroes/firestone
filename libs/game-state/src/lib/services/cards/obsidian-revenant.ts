/* eslint-disable no-mixed-spaces-and-tabs */
// Obsidian Revenant (DEEP_005): 6 Mana 4/6 ELEMENTAL
// "[x]<b>Taunt</b> <b>Deathrattle</b>: Summon two random <b>Deathrattle</b> minions that cost (3) or less."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.DEATHRATTLE) && hasCost(c, '<=', 3);

export const ObsidianRevenant: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ObsidianRevenant_DEEP_005],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ObsidianRevenant.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ObsidianRevenant.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.DEATHRATTLE], possibleCards };
	},
};
