/* eslint-disable no-mixed-spaces-and-tabs */
// Morchie: "Your Rewinds keep BOTH potential outcomes. Battlecry: Discover a Rewind card from any class."
// "from any class" means only class cards should be included, excluding neutrals
import { CardClass, CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Morchie: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Morchie_END_036],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Morchie.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.REWIND) && !c.classes?.includes(CardClass[CardClass.NEUTRAL]),
			input.options,
		);
		return {
			mechanics: [GameTag.REWIND],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Morchie.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.REWIND) && !c.classes?.includes(CardClass[CardClass.NEUTRAL]),
			input.inputOptions,
		);
	},
};
