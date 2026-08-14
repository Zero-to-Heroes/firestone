/* eslint-disable no-mixed-spaces-and-tabs */
// Golden Monkey (BG23_353_Gt): 0 Mana 6/6
// "<b>Taunt</b> <i>(You found it!)</i>"

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const GoldenMonkey: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TreasureSeekerElise_GoldenMonkeyToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GoldenMonkey.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GoldenMonkey.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
