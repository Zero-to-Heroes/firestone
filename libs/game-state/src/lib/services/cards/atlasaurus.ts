/* eslint-disable no-mixed-spaces-and-tabs */
// Atlasaurus (DINO_431): 8 Mana 5/10 BEAST
// "<b>Taunt</b>. <b>Deathrattle:</b> Summon a random <b>Taunt</b> minion that costs (5) or more."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && hasCost(c, '>=', 5);

export const Atlasaurus: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Atlasaurus_DINO_431],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Atlasaurus.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Atlasaurus.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
