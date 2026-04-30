import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../../models/game-state';
import { getShatteredRecombinedPossibleCards } from '../../../card-utils';
import { GameEvent } from '../../game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { ActionChainParser } from './_action-chain-parser';

export class ShatterRecombineParser implements ActionChainParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.RECEIVE_CARD_IN_HAND;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const receiveCardInHandEvent = reversedEvents.shift();
		const isPlayer = receiveCardInHandEvent!.controllerId === receiveCardInHandEvent!.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		const entityId = receiveCardInHandEvent!.entityId;
		const subSpellStartEvent = reversedEvents.find((e) => e.type === GameEvent.SUB_SPELL_START);
		if (!subSpellStartEvent) {
			return currentState;
		}

		if (subSpellStartEvent.additionalData.prefabId !== 'CATAFX_Shattered_Combined_OverrideSpawn_Super') {
			return currentState;
		}

		if (subSpellStartEvent.entityId !== entityId) {
			return currentState;
		}

		const cardInHand = currentState.opponentDeck.hand.find((c) => c.entityId === entityId);
		if (!cardInHand) {
			return currentState;
		}

		const possibleCards = getShatteredRecombinedPossibleCards(
			currentState.opponentDeck,
			this.allCards.getService(),
			cardInHand.guessedInfo,
		);
		if (!possibleCards.length) {
			return currentState;
		}

		const updatedGuessedInfo = {
			...cardInHand.guessedInfo,
			possibleCards: possibleCards,
			mechanics: [...(cardInHand.guessedInfo?.mechanics ?? []), GameTag.SHATTER],
		};
		const updatedCardInHand = cardInHand.update({
			guessedInfo: updatedGuessedInfo,
		});
		const newHand = this.helper.replaceCardInZone(currentState.opponentDeck.hand, updatedCardInHand);
		const newDeckState = currentState.opponentDeck.update({
			hand: newHand,
		});
		return currentState.update({
			opponentDeck: newDeckState,
		});
	}
}
