/* eslint-disable no-mixed-spaces-and-tabs */
// Sunken Sweeper (TSC_776t / Story_11_SunkenSweeper)
// "<b>Battlecry:</b> Add 3 random Mechs to your hand."
// The minions are added to hand (random, not discover), so it needs dynamicPool + guessInfo
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SunkenSweeper: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AzsharanSweeper_SunkenSweeperToken, CardIds.SunkenSweeper],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SunkenSweeper.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SunkenSweeper.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: possibleCards,
		};
	},
};
