import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckState, GameState } from '@firestone/game-state';
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
			// console.debug('considering update', cardId, update, gameEvent);
			updateDataScriptInfoUnsafe(deck, cardId, entityId, update.DataNum1, update.DataNum2, this.helper);

			const cardInHand = deck.hand.find((c) => c.entityId === entityId);
			let newAbyssalCurseHighestValue = deck.abyssalCurseHighestValue;
			let newHand = deck.hand;
			if (cardInHand) {
				const cardWithAdditionalAttributes = addAdditionalAttribuesInHand(
					cardInHand,
					deck,
					update.DataNum1,
					update.DataNum2,
					update,
					this.allCards,
				);
				newHand = deck.hand;

				newAbyssalCurseHighestValue =
					cardWithAdditionalAttributes.cardId === CardIds.SirakessCultist_AbyssalCurseToken
						? Math.max(
								deck.abyssalCurseHighestValue ?? 0,
								// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
								// while it is in the ENTITY_UPDATE event for the opponent
								!!update.DataNum1 && update.DataNum1 !== -1
									? update.DataNum1
									: cardWithAdditionalAttributes.mainAttributeChange + 1,
						  )
						: deck.abyssalCurseHighestValue;
				continue;
			}
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
			}),
			opponentDeck: opponentDeck.update({
				hand: opponentDeck.hand,
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
): void => {
	const found = deck.findCard(entityId);
	if (!found?.card || !found?.zone) {
		const enchant = deck.enchantments.find((e) => e.entityId === entityId);
		if (enchant) {
			if (!enchant.tags) {
				enchant.tags = {};
			}
			enchant.tags[GameTag.TAG_SCRIPT_DATA_NUM_1] = dataNum1;
			enchant.tags[GameTag.TAG_SCRIPT_DATA_NUM_2] = dataNum2;
			console.debug('updating deck enchantment', enchant, deck);
		}
		return;
	}

	const { zone: zoneId, card } = found;
	card.tags[GameTag.TAG_SCRIPT_DATA_NUM_1] = dataNum1;
	card.tags[GameTag.TAG_SCRIPT_DATA_NUM_2] = dataNum2;
};
