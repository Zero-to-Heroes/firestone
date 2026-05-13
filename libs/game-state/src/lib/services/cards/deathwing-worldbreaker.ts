/* eslint-disable no-mixed-spaces-and-tabs */
// Agency Espionage (WORK_004)
// 4-Cost Rogue Spell
// "Shuffle a card from each other class into your deck. They cost (1). Draw one."
import { CardIds, CardRarity, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DeathwingWorldbreaker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DeathwingWorldbreaker_CATA_190h],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DeathwingWorldbreaker.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectTribe(c, Race.DRAGON),
			input.options,
		);
		return {
			possibleCards: possibleCards,
			cost: 1,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DeathwingWorldbreaker.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
};
