import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { addAdditionalAttribuesInHand } from './receive-card-in-hand-parser';

export class DataScriptChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const updatedDeck = updateDataScriptInfo(
			deck,
			cardId,
			entityId,
			gameEvent.additionalData.dataNum1,
			gameEvent.additionalData.dataNum2,
			this.helper,
		);

		const cardInHand = updatedDeck.hand.find((c) => c.entityId === entityId);
		// if (!cardInHand) {
		// 	// console.warn('[data-script-changed] no card', gameEvent, deck.hand);
		// 	return currentState;
		// }

		const cardWithAdditionalAttributes = !cardInHand
			? null
			: addAdditionalAttribuesInHand(cardInHand, updatedDeck, gameEvent, this.allCards);
		const previousHand = updatedDeck.hand;
		const newHand: readonly DeckCard[] = !cardInHand
			? previousHand
			: this.helper.replaceCardInZone(previousHand, cardWithAdditionalAttributes);

		const newPlayerDeck = Object.assign(new DeckState(), updatedDeck, {
			hand: newHand,
			abyssalCurseHighestValue:
				cardWithAdditionalAttributes?.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(
							updatedDeck.abyssalCurseHighestValue ?? 0,
							// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
							// while it is in the ENTITY_UPDATE event for the opponent
							!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
								? gameEvent.additionalData.dataNum1
								: cardWithAdditionalAttributes.mainAttributeChange + 1,
					  )
					: updatedDeck.abyssalCurseHighestValue,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.DATA_SCRIPT_CHANGED;
	}
}

const updateDataScriptInfo = (
	deck: DeckState,
	cardId: string,
	entityId: number,
	dataNum1: number,
	dataNum2: number,
	helper: DeckManipulationHelper,
): DeckState => {
	const found = deck.findCard(entityId);
	if (!found?.card || !found?.zone) {
		if (deck.enchantments.find((e) => e.entityId === entityId)) {
			const enchantment = deck.enchantments.find((e) => e.entityId === entityId);
			const newEnchantment = {
				...enchantment,
				tags: [
					...(enchantment.tags ?? []).filter(
						(t) => t.Name !== GameTag.TAG_SCRIPT_DATA_NUM_1 && t.Name !== GameTag.TAG_SCRIPT_DATA_NUM_2,
					),
					{ Name: GameTag.TAG_SCRIPT_DATA_NUM_1, Value: dataNum1 },
					{ Name: GameTag.TAG_SCRIPT_DATA_NUM_2, Value: dataNum2 },
				],
			};
			return deck.update({
				enchantments: [...deck.enchantments.filter((e) => e.entityId !== entityId), newEnchantment],
			});
		}
		return deck;
	}

	const { zone: zoneId, card } = found;
	const newCard = card.update({
		tags: [
			...card.tags.filter(
				(t) => t.Name !== GameTag.TAG_SCRIPT_DATA_NUM_1 && t.Name !== GameTag.TAG_SCRIPT_DATA_NUM_1,
			),
			{ Name: GameTag.TAG_SCRIPT_DATA_NUM_1, Value: dataNum1 },
			{ Name: GameTag.TAG_SCRIPT_DATA_NUM_2, Value: dataNum2 },
		],
	});
	switch (zoneId) {
		case 'board':
			const newBoard = helper.replaceCardInZone(deck.board, newCard);
			return deck.update({ board: newBoard });
		case 'hand':
			const newHand = helper.replaceCardInZone(deck.hand, newCard);
			return deck.update({ hand: newHand });
		case 'deck':
			const newDeck = helper.replaceCardInZone(deck.deck, newCard);
			return deck.update({ deck: newDeck });
		case 'other':
			const newOther = helper.replaceCardInZone(deck.otherZone, newCard);
			return deck.update({ otherZone: newOther });
		default:
			return deck;
	}
};
