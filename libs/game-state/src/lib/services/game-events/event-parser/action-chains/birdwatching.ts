import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { ActionChainParser } from './_action-chain-parser';

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
		const isPlayer = attackUpdatedEvent!.controllerId === attackUpdatedEvent!.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		if (attackUpdatedEvent!.additionalData.sourceCardId !== CardIds.Birdwatching_VAC_408) {
			return currentState;
		}

		const deckState = currentState.opponentDeck;
		const drawnCardInHand = deckState.hand.find(
			(c) => c.lastAffectedByEntityId === attackUpdatedEvent!.additionalData.sourceEntityId,
		);
		const refCard = this.allCards.getCard(attackUpdatedEvent!.cardId);
		const updatedCardInHand = drawnCardInHand?.update({
			cardId: refCard.id,
			cardName: refCard.name,
			refManaCost: refCard.cost,
			rarity: refCard.rarity?.toLowerCase(),
			cardType: refCard.type,
		});
		const newHand = this.helper.replaceCardInZone(deckState.hand, updatedCardInHand!);
		const newDeckState = deckState.update({
			hand: newHand,
		});
		return currentState.update({
			opponentDeck: newDeckState,
		});
	}
}
