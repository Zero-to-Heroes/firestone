/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Assembly Line (YOG_410): Discover a Mech from another class.
export const AssemblyLine: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AssemblyLine_YOG_410],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			AssemblyLine.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MECH) &&
				fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AssemblyLine.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MECH) &&
				fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
