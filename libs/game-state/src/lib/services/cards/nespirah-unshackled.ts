/* eslint-disable no-mixed-spaces-and-tabs */
// Nespirah, Unshackled (CATA_527t2)
// 6 Mana 6/6 Demon Hunter Beast Minion (Legendary)
// "After you cast a Fel spell, get a random non-Colossal Naga. It costs (1)."

import { CardIds, CardType, GameTag, hasCorrectTribe, hasMechanic, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const NespirahUnshackled: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NespirahEnthralled_NespirahUnshackledToken_CATA_527t2],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			NespirahUnshackled.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.NAGA) &&
				!hasMechanic(c, GameTag.COLOSSAL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.NAGA],
			cost: { cost: 1, comparison: '==' },
			possibleCards: filterCards(
				NespirahUnshackled.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.NAGA) &&
					!hasMechanic(c, GameTag.COLOSSAL),
				input.options,
			),
		};
	},
};
