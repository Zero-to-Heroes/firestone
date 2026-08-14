/* eslint-disable no-mixed-spaces-and-tabs */
// Treacherous Tormentor (EDR_102): 4 Mana 5/4 DEMON
// "<b>Battlecry:</b> <b>Discover</b> a <b>Legendary</b> minion with a <b>Dark Gift</b>."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectRarity(c, CardRarity.LEGENDARY) &&
	canBeDiscoveredByClass(c, currentClass);

export const TreacherousTormentor: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TreacherousTormentor_EDR_102],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TreacherousTormentor.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			TreacherousTormentor.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
