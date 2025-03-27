import { DeckCard, DeckState, GameState, ShortCard, TurnTiming } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { isBattlegrounds } from '../../battlegrounds/bgs-utils';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	constructor(private readonly owUtils: OwUtilsService, private readonly prefs: PreferencesService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer, opponentPlayer] = gameEvent.parse();
		const gameTurnNumber = gameEvent.additionalData.turnNumber;
		const numericTurn = Math.ceil(gameTurnNumber / 2);
		// console.debug(
		// 	'[turn-start] numericTurn',
		// 	numericTurn,
		// 	gameTurnNumber,
		// 	currentState.playerDeck.isFirstPlayer,
		// 	currentState,
		// );

		const currentTurn = currentState.mulliganOver || numericTurn >= 2 ? numericTurn : 'mulligan';
		const isPlayerActive = gameEvent.additionalData.activePlayerId === localPlayer.PlayerId;
		const isPlayerActiveInPreviousTurn = currentState.playerDeck.isActivePlayer;
		// console.debug('[turn-start] currentTurn', currentTurn, isPlayerActive, isPlayerActiveInPreviousTurn);
		// const isPlayerActive = currentState.playerDeck.isFirstPlayer
		// 	? gameTurnNumber % 2 === 1
		// 	: gameTurnNumber % 2 === 0;
		// console.debug('[turn-start] isPlayerActive', isPlayerActive, currentState.playerDeck.isFirstPlayer);
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
			isPlayerActiveInPreviousTurn,
			gameEvent.additionalData.timestamp,
			currentState,
		);
		const playerDeck = currentState.playerDeck.update({
			isActivePlayer: isPlayerActive,
			// Looks like both serve the same purpose
			cardsPlayedLastTurn: !isPlayerActive
				? currentState.playerDeck.cardsPlayedThisTurn
				: currentState.playerDeck.cardsPlayedLastTurn,
			cardsPlayedThisTurn: isPlayerActive
				? ([] as readonly DeckCard[])
				: currentState.playerDeck.cardsPlayedThisTurn,
			cardsCounteredThisTurn: 0,
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
			cardsPlayedLastTurn: isPlayerActive
				? currentState.opponentDeck.cardsPlayedThisTurn
				: currentState.opponentDeck.cardsPlayedLastTurn,
			cardsPlayedThisTurn: !isPlayerActive
				? ([] as readonly DeckCard[])
				: currentState.opponentDeck.cardsPlayedThisTurn,
			damageTakenThisTurn: 0,
			elementalsPlayedLastTurn: !isPlayerActive
				? currentState.opponentDeck.elementalsPlayedLastTurn
				: currentState.opponentDeck.elementalsPlayedThisTurn,
			elementalsPlayedThisTurn: 0,
			minionsDeadSinceLastTurn: isPlayerActive ? [] : currentState.opponentDeck.minionsDeadSinceLastTurn,
			minionsDeadThisTurn: [] as readonly ShortCard[],
			turnTimings: opponentTurnTimings,
		} as DeckState);
		// console.debug(
		// 	'[turn-start] playerDeck',
		// 	isPlayerActive,
		// 	playerDeck.cardsPlayedLastTurn,
		// 	playerDeck.cardsPlayedThisTurn,
		// 	opponentDeck.cardsPlayedLastTurn,
		// 	opponentDeck.cardsPlayedThisTurn,
		// );

		const startOfTurnState = currentState.update({
			currentTurn: currentTurn,
			gameTagTurnNumber: gameTurnNumber,
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
			mulliganOver: currentState.mulliganOver || numericTurn >= 2,
		});
		return startOfTurnState;
	}

	event(): string {
		return GameEvent.TURN_START;
	}
}

export const buildTurnTimings = (
	currentTurn: number | 'mulligan',
	isPlayerActive: boolean,
	isPlayerActiveInPreviousTurn: boolean,
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
	if (!isPlayerActive || isPlayerActiveInPreviousTurn) {
		// Close the previous turn
		if (lastPlayerTurn) {
			playerTurns = [...playerTurns.slice(0, -1), { ...lastPlayerTurn, endTimestamp: turnTimestamp }];
		}
		if (!isPlayerActive) {
			opponentTurns = [
				...opponentTurns,
				{ turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined },
			];
		} else {
			playerTurns = [
				...playerTurns,
				{ turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined },
			];
		}
	} else {
		if (lastOpponentTurn) {
			opponentTurns = [...opponentTurns.slice(0, -1), { ...lastOpponentTurn, endTimestamp: turnTimestamp }];
		}
		if (!isPlayerActive) {
			opponentTurns = [
				...opponentTurns,
				{ turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined },
			];
		} else {
			playerTurns = [
				...playerTurns,
				{ turn: currentTurn, startTimestamp: turnTimestamp, endTimestamp: undefined },
			];
		}
	}
	return [playerTurns, opponentTurns];
};
