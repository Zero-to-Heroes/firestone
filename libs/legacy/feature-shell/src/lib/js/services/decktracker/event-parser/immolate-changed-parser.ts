import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ImmolateChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const found = deck.findCard(entityId);
		if (!found) {
			return currentState;
		}

		const { zone, card } = found;
		if (zone !== 'hand') {
			return currentState;
		}

		const newCard = card.update({
			turnsUntilImmolate: gameEvent.additionalData.immolating ? gameEvent.additionalData.stage : null,
		});
		const newHand = this.helper.replaceCardInZone(deck.hand, newCard);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({
				hand: newHand,
			}),
		});
	}

	event(): string {
		return GameEvent.IMMOLATE_CHANGED;
	}
}
