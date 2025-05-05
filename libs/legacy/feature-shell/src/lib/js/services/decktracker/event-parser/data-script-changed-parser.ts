import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { Mutable } from '@firestone/shared/framework/common';
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
		const [, , localPlayer] = gameEvent.parse();

		const updates = gameEvent.additionalData.updates;
		const playerDeck = currentState.playerDeck;
		const opponentDeck = currentState.opponentDeck;

		for (const update of updates) {
			const controllerId = update.ControllerId;
			const entityId = update.EntityId;
			const cardId = update.CardId;

			const isPlayer = controllerId === localPlayer.PlayerId;
			const deck = isPlayer ? playerDeck : opponentDeck;
			const updatedDeck = updateDataScriptInfoUnsafe(
				deck,
				cardId,
				entityId,
				gameEvent.additionalData.dataNum1,
				gameEvent.additionalData.dataNum2,
				this.helper,
			);

			const cardInHand = updatedDeck.hand.find((c) => c.entityId === entityId);
			const cardWithAdditionalAttributes = !cardInHand
				? null
				: addAdditionalAttribuesInHand(cardInHand, updatedDeck, gameEvent, this.allCards);
			const previousHand = updatedDeck.hand;
			const newHand: readonly DeckCard[] = !cardInHand
				? previousHand
				: this.helper.replaceCardInZone(previousHand, cardWithAdditionalAttributes);

			const newAbyssalCurseHighestValue =
				cardWithAdditionalAttributes?.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(
							updatedDeck.abyssalCurseHighestValue ?? 0,
							// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
							// while it is in the ENTITY_UPDATE event for the opponent
							!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
								? gameEvent.additionalData.dataNum1
								: cardWithAdditionalAttributes.mainAttributeChange + 1,
					  )
					: updatedDeck.abyssalCurseHighestValue;
			// Modify in place
			if (isPlayer) {
				(playerDeck as Mutable<DeckState>).hand = newHand;
				(playerDeck as Mutable<DeckState>).abyssalCurseHighestValue = newAbyssalCurseHighestValue;
			}
			if (!isPlayer) {
				(opponentDeck as Mutable<DeckState>).hand = newHand;
				(opponentDeck as Mutable<DeckState>).abyssalCurseHighestValue = newAbyssalCurseHighestValue;
			}
		}

		return currentState.update({
			playerDeck: playerDeck.update({
				hand: playerDeck.hand,
				board: playerDeck.board,
			}),
			opponentDeck: opponentDeck.update({
				hand: opponentDeck.hand,
				board: opponentDeck.board,
			}),
		});
	}

	event(): string {
		return GameEvent.DATA_SCRIPT_CHANGED;
	}
}

const updateDataScriptInfoUnsafe = (
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
			console.debug('updating deck enchantment', newEnchantment);
			return deck.update({
				enchantments: [...deck.enchantments.filter((e) => e.entityId !== entityId), newEnchantment],
			});
		}
		return deck;
	}

	const { zone: zoneId, card } = found;
	card.tags[GameTag.TAG_SCRIPT_DATA_NUM_1] = dataNum1;
	card.tags[GameTag.TAG_SCRIPT_DATA_NUM_2] = dataNum2;
	// const newCard =  card.update({
	// 	tags: {
	// 		...card.tags,
	// 		[GameTag.TAG_SCRIPT_DATA_NUM_1]: dataNum1,
	// 		[GameTag.TAG_SCRIPT_DATA_NUM_2]: dataNum2,
	// 	},
	// });
	// switch (zoneId) {
	// 	case 'board':
	// 		const newBoard = helper.replaceCardInZone(deck.board, newCard);
	// 		return deck.update({ board: newBoard });
	// 	case 'hand':
	// 		const newHand = helper.replaceCardInZone(deck.hand, newCard);
	// 		return deck.update({ hand: newHand });
	// 	case 'deck':
	// 		const newDeck = helper.replaceCardInZone(deck.deck, newCard);
	// 		return deck.update({ deck: newDeck });
	// 	case 'other':
	// 		const newOther = helper.replaceCardInZone(deck.otherZone, newCard);
	// 		return deck.update({ otherZone: newOther });
	// 	default:
	// 		return deck;
	// }
	return deck;
};
