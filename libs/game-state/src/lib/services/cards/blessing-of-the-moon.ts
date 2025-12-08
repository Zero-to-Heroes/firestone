/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import {
	canBeDiscoveredByClass,
	getPlayerOrOpponentFromFullGameState,
	getPlayerTag,
	hasCorrectClass,
	hasCorrectType,
	hasCost,
} from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlessingOfTheMoon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const imbueLevel = getPlayerTag(
			getPlayerOrOpponentFromFullGameState(input.inputOptions.deckState, input.inputOptions.gameState),
			GameTag.IMBUES_THIS_GAME,
			0,
		);
		const heroPowerCost =
			input.inputOptions.gameState.fullGameState?.Player?.AllEntities?.find(
				(e) => e.entityId === input.entityId,
			)?.tags?.find((t) => t.Name === GameTag.COST)?.Value ??
			input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ??
			2;
		const manaLeft = input.inputOptions.deckState.manaLeft ?? 0;
		const maxManaLeft = manaLeft - heroPowerCost + imbueLevel;
		const result = filterCards(
			BlessingOfTheMoon.cardIds[0],
			input.allCards,
			(c) =>
				(hasCorrectType(c, CardType.MINION) || hasCorrectType(c, CardType.SPELL)) &&
				hasCorrectClass(c, CardClass.PRIEST) &&
				hasCost(c, '<=', maxManaLeft) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
		return result;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const imbueLevel = getPlayerTag(
			getPlayerOrOpponentFromFullGameState(input.deckState, input.gameState),
			GameTag.IMBUES_THIS_GAME,
			0,
		);
		const heroPowerCost =
			input.gameState.fullGameState?.Player?.AllEntities?.find(
				(e) => e.entityId === input.card.entityId,
			)?.tags?.find((t) => t.Name === GameTag.COST)?.Value ??
			input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ??
			2;
		const manaLeft = input.deckState.manaLeft ?? 0;
		const maxManaLeft = manaLeft - heroPowerCost + imbueLevel;
		const result = filterCards(
			BlessingOfTheMoon.cardIds[0],
			input.allCards,
			(c) =>
				(hasCorrectType(c, CardType.MINION) || hasCorrectType(c, CardType.SPELL)) &&
				hasCorrectClass(c, CardClass.PRIEST) &&
				hasCost(c, '<=', maxManaLeft) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			possibleCards: result,
		};
	},
};
