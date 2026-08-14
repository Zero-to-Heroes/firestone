/* eslint-disable no-mixed-spaces-and-tabs */
// Tortotem (DINO_412): 1 Mana 0/3 TOTEM
// "[x]At the end of your turn, get a random minion with multiple minion types."

import { CardIds, CardType, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && (c.races?.includes(Race[Race.ALL]) || (c?.races?.length ?? 0) >= 2);

export const Tortotem: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Tortotem_DINO_412],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Tortotem.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Tortotem.cardIds[0], input.allCards, isMatch, input.options);
		return { possibleCards };
	},
};
