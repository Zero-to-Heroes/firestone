/* eslint-disable no-mixed-spaces-and-tabs */
// Bone Drake (ICC_027): 6 Mana 6/5 Neutral Dragon minion
// "<b>Deathrattle:</b> Add a random Dragon to your hand."
// Since it adds a card to hand, it needs both dynamicPool and guessInfo

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BoneDrake: GeneratingCard & StaticGeneratingCard = {
	cardIds: ['ICC_027' as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BoneDrake.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				BoneDrake.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
				input.options,
			),
		};
	},
};
