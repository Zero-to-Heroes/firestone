import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState, TurnTiming } from '../../../models/decktracker/deck-state';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { isBattlegrounds } from '../../battlegrounds/bgs-utils';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { OwUtilsService } from '../../plugins/ow-utils.service';
import { PreferencesService } from '../../preferences.service';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	constructor(private readonly owUtils: OwUtilsService, private readonly prefs: PreferencesService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const numericTurn = currentState.playerDeck.isFirstPlayer
			? Math.floor(gameEvent.additionalData.turnNumber / 2)
			: Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);

		const currentTurn = currentState.mulliganOver || numericTurn >= 2 ? numericTurn : 'mulligan';
		const isPlayerActive = currentState.playerDeck.isFirstPlayer
			? gameEvent.additionalData.turnNumber % 2 === 1
			: gameEvent.additionalData.turnNumber % 2 === 0;
		if (
			isPlayerActive &&
			!isBattlegrounds(currentState.metadata.gameType) &&
			!isMercenaries(currentState.metadata.gameType)
		) {
			const prefs = await this.prefs.getPreferences();
			if (prefs.flashWindowOnYourTurn) {
				this.owUtils.flashWindow();
			}
		}

		const [playerTurnTimings, opponentTurnTimings] = buildTurnTimings(
			currentTurn,
			isPlayerActive,
			gameEvent.additionalData.timestamp,
			currentState,
		);
		const playerDeck = currentState.playerDeck.update({
			isActivePlayer: isPlayerActive,
			cardsPlayedLastTurn: currentState.playerDeck.cardsPlayedThisTurn,
			cardsPlayedThisTurn: [] as readonly DeckCard[],
			damageTakenThisTurn: 0,
			elementalsPlayedLastTurn: isPlayerActive
				? currentState.playerDeck.elementalsPlayedLastTurn
				: currentState.playerDeck.elementalsPlayedThisTurn,
			elementalsPlayedThisTurn: 0,
			minionsDeadSinceLastTurn: !isPlayerActive ? [] : currentState.playerDeck.minionsDeadSinceLastTurn,
			minionsDeadThisTurn: [] as readonly ShortCard[],
			turnTimings: playerTurnTimings,
		} as DeckState);
		const opponentDeck = currentState.opponentDeck.update({
			isActivePlayer: !isPlayerActive,
			cardsPlayedLastTurn: currentState.opponentDeck.cardsPlayedThisTurn,
			cardsPlayedThisTurn: [] as readonly DeckCard[],
			damageTakenThisTurn: 0,
			elementalsPlayedLastTurn: !isPlayerActive
				? currentState.opponentDeck.elementalsPlayedLastTurn
				: currentState.opponentDeck.elementalsPlayedThisTurn,
			elementalsPlayedThisTurn: 0,
			minionsDeadSinceLastTurn: isPlayerActive ? [] : currentState.opponentDeck.minionsDeadSinceLastTurn,
			minionsDeadThisTurn: [] as readonly ShortCard[],
			turnTimings: opponentTurnTimings,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			currentTurn: currentTurn,
			gameTagTurnNumber: gameEvent.additionalData.turnNumber,
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
			mulliganOver: currentState.mulliganOver || numericTurn >= 2,
		} as GameState);
	}

	event(): string {
		return GameEvent.TURN_START;
	}
}

export const buildTurnTimings = (
	currentTurn: number | 'mulligan',
	isPlayerActive: boolean,
	turnTimestamp: number,
	currentState: GameState,
): [readonly TurnTiming[], readonly TurnTiming[]] => {
	let playerTurns: TurnTiming[] = [...currentState.playerDeck.turnTimings];
	let opponentTurns: TurnTiming[] = [...currentState.opponentDeck.turnTimings];
	// Reconnects
	if (!turnTimestamp || turnTimestamp < 0 || currentTurn === 'mulligan') {
		return [playerTurns, opponentTurns];
	}

	const lastPlayerTurn = currentState.playerDeck.turnTimings[currentState.playerDeck.turnTimings.length - 1];
	const lastOpponentTurn = currentState.opponentDeck.turnTimings[currentState.opponentDeck.turnTimings.length - 1];
	if (!isPlayerActive) {
		// Close the previous turn
		if (lastPlayerTurn) {
			playerTurns = [...playerTurns.slice(0, -1), { ...lastPlayerTurn, endTimestamp: turnTimestamp }];
		}
		opponentTurns = [
			...opponentTurns,
			{ turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined },
		];
	} else {
		if (lastOpponentTurn) {
			opponentTurns = [...opponentTurns.slice(0, -1), { ...lastOpponentTurn, endTimestamp: turnTimestamp }];
		}
		playerTurns = [...playerTurns, { turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined }];
	}
	return [playerTurns, opponentTurns];
};
