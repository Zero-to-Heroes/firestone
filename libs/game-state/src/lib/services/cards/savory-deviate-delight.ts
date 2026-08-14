/* eslint-disable no-mixed-spaces-and-tabs */
// Savory Deviate Delight (WC_017): 1 Mana
// "[x]Transform a minion in both players' hands into a Pirate or <b>Stealth</b> minion."

import { CardIds, CardType, GameTag, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) &&
	(hasCorrectTribe(c, Race.PIRATE) || c.mechanics?.includes(GameTag[GameTag.STEALTH]));

export const SavoryDeviateDelight: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SavoryDeviateDelight],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SavoryDeviateDelight.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SavoryDeviateDelight.cardIds[0], input.allCards, isMatch, input.options);
		return { possibleCards };
	},
};
