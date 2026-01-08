/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const GorgonzormuDeliciousCheese: StaticGeneratingCard = {
	cardIds: [CardIds.Gorgonzormu_DeliciousCheeseToken_VAC_955t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput): readonly string[] => {
		const card = input.inputOptions?.deckState.findCard(input.entityId)?.card;
		if (!card) {
			return [];
		}
		const createdAtTurn = card.metaInfo?.turnAtWhichCardEnteredHand as number;
		const turnsInHand = (input.inputOptions?.gameState?.currentTurn as number) - createdAtTurn;
		const cheeseCost = Math.min(10, 1 + turnsInHand);
		const possibleCards = filterCards(
			GorgonzormuDeliciousCheese.cardIds[0],
			input.allCards,
			(c) => c.cost === cheeseCost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		console.debug('[debug] GorgonzormuDeliciousCheese', possibleCards);
		return possibleCards;
	},
};
