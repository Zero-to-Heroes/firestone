/* eslint-disable no-mixed-spaces-and-tabs */
// Wave of Nostalgia (MIS_701): 5 Mana
// "Transform ALL minions into random <b>Legendary</b> ones from the past."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const WaveOfNostalgia: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WaveOfNostalgia_MIS_701],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(WaveOfNostalgia.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(
			WaveOfNostalgia.cardIds[0],
			input.allCards,
			isMatch,
			input.options,
		);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
