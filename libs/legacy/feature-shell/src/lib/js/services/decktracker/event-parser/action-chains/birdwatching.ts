import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { ActionChainParser } from './_action-chain-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export class BirdwatchingParser implements ActionChainParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.MINION_ON_BOARD_ATTACK_UPDATED;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const attackUpdatedEvent = reversedEvents.shift();
		const isPlayer = attackUpdatedEvent.controllerId === attackUpdatedEvent.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		if (attackUpdatedEvent.additionalData.sourceCardId !== CardIds.Birdwatching_VAC_408) {
			return currentState;
		}

		const deckState = currentState.opponentDeck;
		const drawnCardInHand = deckState.hand.find(
			(c) => c.lastAffectedByEntityId === attackUpdatedEvent.additionalData.sourceEntityId,
		);
		const refCard = this.allCards.getCard(attackUpdatedEvent.cardId);
		const updatedCardInHand = drawnCardInHand?.update({
			cardId: refCard.id,
			cardName: refCard.name,
			refManaCost: refCard.cost,
			rarity: refCard.rarity?.toLowerCase(),
			cardType: refCard.type,
		});
		const newHand = this.helper.replaceCardInZone(deckState.hand, updatedCardInHand);
		const newDeckState = deckState.update({
			hand: newHand,
		});
		return currentState.update({
			opponentDeck: newDeckState,
		});
	}
}
