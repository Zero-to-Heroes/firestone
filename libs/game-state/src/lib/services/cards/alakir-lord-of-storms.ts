/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AlakirLordOfStorms: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AlakirLordOfStorms_CATA_153],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const atkTag = input.options?.tags?.find((t) => t.Name === GameTag.ATK);
		const attack = atkTag?.Value ?? 2;
		const possibleCards = filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', attack),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
