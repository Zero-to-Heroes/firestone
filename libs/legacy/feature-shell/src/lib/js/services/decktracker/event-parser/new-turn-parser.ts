import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import {
	BattlegroundsState,
	BgsNextOpponentOverviewPanel,
	BgsPanel,
	DeckCard,
	GameState,
	ShortCard,
	TurnTiming,
} from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { ILocalizationService, OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { isBattlegrounds } from '../../battlegrounds/bgs-utils';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	constructor(
		private readonly owUtils: OwUtilsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {}

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
			if (prefs.showNotificationOnYourTurn) {
				this.owUtils.showWindowsNotification(
					this.i18n.translateString('app.decktracker.notifications.turn-start-title'),
					this.i18n.translateString('app.decktracker.notifications.turn-start-message', {
						value: numericTurn,
					}),
				);
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
			currentOptions: [],
		});
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
			currentOptions: [],
		});
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

		if (isBattlegrounds(currentState.metadata.gameType)) {
			const newPanelId = gameTurnNumber === 1 ? 'bgs-next-opponent-overview' : this.nav.currentPanelId$$.value;
			this.nav.currentPanelId$$.next(newPanelId);
			const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.rebuildNextOpponentPanel(
				currentState.bgState,
				numericTurn,
			);
			const panels: readonly BgsPanel[] = currentState.bgState.panels.map((stage) =>
				stage.id === newNextOpponentPanel.id ? newNextOpponentPanel : stage,
			);
			return startOfTurnState.update({
				bgState: currentState.bgState.update({
					panels: panels,
				}),
			});
		}

		return startOfTurnState;
	}

	event(): string {
		return GameEvent.TURN_START;
	}

	private rebuildNextOpponentPanel(
		currentState: BattlegroundsState,
		newCurrentTurn: number,
	): BgsNextOpponentOverviewPanel {
		return (
			currentState.panels.find(
				(panel) => panel.id === 'bgs-next-opponent-overview',
			) as BgsNextOpponentOverviewPanel
		).update({
			name: this.i18n.translateString('battlegrounds.in-game.opponents.next-opponent-title', {
				turn: newCurrentTurn,
			}),
		} as BgsNextOpponentOverviewPanel);
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
