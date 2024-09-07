import { isCoin } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';
import { buildTurnTimings } from './new-turn-parser';

export class MainStepReadyParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// We use this to distinguish between mulligan over but getting cards from mulligan and
		// real draw start
		if (currentState.currentTurn !== 0) {
			return currentState;
		}

		// Don't know why, but sometimes the end of mulligan event and turn_start events don't follow a fixed
		// sequence
		// So here it's possible that we got a TURN_START event at the beginning of mulligan, and
		const currentTurn = 1;
		const isPlayerActive = currentState.playerDeck.isFirstPlayer;
		const [playerTurnTimings, opponentTurnTimings] =
			!currentState.playerDeck.turnTimings.length && !currentState.playerDeck.turnTimings.length
				? buildTurnTimings(currentTurn, isPlayerActive, false, gameEvent.additionalData.timestamp, currentState)
				: [currentState.playerDeck.turnTimings, currentState.opponentDeck.turnTimings];

		return Object.assign(new GameState(), currentState, {
			mulliganOver: true,
			currentTurn: currentTurn,
			playerDeck: currentState.playerDeck.update({
				turnTimings: playerTurnTimings,
				cardsInStartingHand: currentState.playerDeck.hand
					.map((card) => ({ ...card } as DeckCard))
					.filter((card) => !isCoin(card.cardId, this.allCards)),
			}),
			opponentDeck: currentState.opponentDeck.update({
				turnTimings: opponentTurnTimings,
				cardsInStartingHand: currentState.opponentDeck.hand
					.map((card) => ({ ...card } as DeckCard))
					.filter((card) => !isCoin(card.cardId, this.allCards)),
			}),
		} as GameState);
	}

	event(): string {
		return GameEvent.MAIN_STEP_READY;
	}
}
