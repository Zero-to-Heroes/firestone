/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// TODO: Verify card mechanics - GIL_504h mechanics need to be confirmed
// Placeholder implementation - needs to be updated with actual card mechanics
export const Gil504h: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Gil504h],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// TODO: Replace with actual filtering logic based on card mechanics
		return filterCards(
			Gil504h.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL],
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// TODO: Replace with actual card type and filtering logic
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				Gil504h.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.SPELL],
				input.options,
			),
		};
	},
};
