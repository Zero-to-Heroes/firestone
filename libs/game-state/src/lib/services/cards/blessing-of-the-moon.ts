/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import {
	canBeDiscoveredByClass,
	hasCorrectClass,
	hasCorrectType,
	hasCost,
} from '../../related-cards/dynamic-pools';
import { getControllerEntity, getEntityTag } from '../../services/parser-entity-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const getImbueLevel = (gameState: { parserState?: any; localPlayerId?: number; opponentPlayerId?: number }, isOpponent: boolean): number => {
	const playerId = isOpponent ? gameState.opponentPlayerId : gameState.localPlayerId;
	const controllerEntity = getControllerEntity(
		gameState.parserState?.CurrentEntities,
		gameState.parserState?.ControllerEntityMap,
		playerId!,
	);
	return getEntityTag(controllerEntity, GameTag.IMBUES_THIS_GAME, 0);
};

export const BlessingOfTheMoon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const gameState = input.inputOptions.gameState;
		const imbueLevel = getImbueLevel(gameState, input.inputOptions.deckState.isOpponent);
		const entity = gameState.parserState?.CurrentEntities.get(input.entityId);
		const heroPowerCost = entity
			? getEntityTag(entity, GameTag.COST, input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ?? 2)
			: input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ?? 2;
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
		const gameState = input.gameState;
		const imbueLevel = getImbueLevel(gameState, input.deckState.isOpponent);
		const entity = gameState.parserState?.CurrentEntities.get(input.card.entityId);
		const heroPowerCost = entity
			? getEntityTag(entity, GameTag.COST, input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ?? 2)
			: input.allCards.getCard(BlessingOfTheMoon.cardIds[0])?.cost ?? 2;
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
