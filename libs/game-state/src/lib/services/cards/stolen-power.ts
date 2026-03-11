/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const StolenPower: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StolenPower_CATA_202],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			StolenPower.cardIds[0],
			input.allCards,
			(c) => c.mechanics?.includes(GameTag[GameTag.SHATTER]) ?? false,
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			StolenPower.cardIds[0],
			input.allCards,
			(c) => c.mechanics?.includes(GameTag[GameTag.SHATTER]) ?? false,
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
};
