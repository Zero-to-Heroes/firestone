/* eslint-disable no-mixed-spaces-and-tabs */
// Bane of Doom (EX1_320 / VAN_EX1_320 / WON_323): 5 Mana
// "Deal $3 damage to a character. If it dies, summon a random Demon."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);

export const BaneOfDoom: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BaneOfDoomLegacy, CardIds.BaneOfDoomVanilla, CardIds.BaneOfDoom_WON_323],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BaneOfDoom.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(BaneOfDoom.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
