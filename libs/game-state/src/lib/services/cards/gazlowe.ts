/* eslint-disable no-mixed-spaces-and-tabs */
// Gazlowe (GVG_117)
// "Whenever you cast a 1-Cost spell, add a random Mech to your hand."
// The minions are added to hand (random, not discover), so it needs dynamicPool + guessInfo
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Gazlowe: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Gazlowe],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Gazlowe.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Gazlowe.cardIds[0],
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
