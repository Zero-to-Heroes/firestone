import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
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
		const isPlayer = attackUpdatedEvent.controllerId === attackUpdatedEvent.localPlayer.PlayerId;
		// Only useful when the opponent handles this
		if (isPlayer) {
			return currentState;
		}

		if (attackUpdatedEvent.additionalData.sourceCardId !== CardIds.Birdwatching_VAC_408) {
			return currentState;
		}

		// Crutch: What happens is:
		// - you discover something with Birdwatching
		// - if a minion on board is buffed, we assume that it's because the Birdwatching discovered a copy of that minion
		// With Parallax Cannon, Discovering is enough to buff the weapon and hero's attack, and that's what trips it.
		// For now I will do a simple patch to only consider minions and ignore heroes / weapons. If later on there is a minion
		// that gets buffed on board whenever you discover something, I'll probably have to remove the advanced oracle for Birdwatching
		const refCard = this.allCards.getCard(attackUpdatedEvent.cardId);
		if (refCard.type?.toUpperCase() !== CardType[CardType.MINION]) {
			return currentState;
		}

		console.debug('[debug] birdwatching parser', attackUpdatedEvent);
		const deckState = currentState.opponentDeck;
		const drawnCardInHand = deckState.hand.find(
			(c) => c.lastAffectedByEntityId === attackUpdatedEvent.additionalData.sourceEntityId,
		);
		console.debug(
			'[debug] birdwatching parser drawnCardInHand',
			drawnCardInHand,
			deckState.hand.filter((c) => c.lastAffectedByEntityId === attackUpdatedEvent.additionalData.sourceEntityId),
		);
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
