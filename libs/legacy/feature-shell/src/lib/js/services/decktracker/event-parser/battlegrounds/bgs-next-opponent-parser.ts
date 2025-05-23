import { normalizeCardId } from '@components/battlegrounds/post-match/card-utils';
import { defaultStartingHp, GameType, isBattlegrounds } from '@firestone-hs/reference-data';
import {
	BgsFaceOffWithSimulation,
	BgsNextOpponentOverviewPanel,
	BgsOpponentOverview,
	GameState,
} from '@firestone/game-state';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsNextOpponentParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// cardID is null when repeating the same opponent
		const cardId = gameEvent.additionalData.nextOpponentCardId;
		const playerId = gameEvent.additionalData.nextOpponentPlayerId;
		const isSameOpponent = gameEvent.additionalData.isSameOpponent;

		const bgState = currentState.bgState;
		const currentNextOpponent = bgState.currentGame.lastFaceOff()?.opponentPlayerId;
		const turn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		if (bgState.currentGame.lastFaceOff()?.turn === turn && currentNextOpponent === playerId) {
			console.debug(
				'[bgs-next-opponent] ignoring duplicate next opponent event',
				turn,
				currentNextOpponent,
				gameEvent,
				bgState,
			);
			return currentState;
		}

		const opponentCardId = isSameOpponent ? bgState.currentGame.lastOpponentCardId : cardId;
		const opponentPlayerId = isSameOpponent ? bgState.currentGame.lastOpponentPlayerId : playerId;
		const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.buildInGamePanel(
			currentState,
			opponentCardId,
			opponentPlayerId,
		);
		console.debug(
			'[bgs-next-opponent] parsing next opponent',
			opponentCardId,
			opponentPlayerId,
			newNextOpponentPanel.opponentOverview?.playerId,
			newNextOpponentPanel,
			event,
		);

		const mainPlayer = bgState.currentGame.getMainPlayer();
		const opponent = bgState.currentGame.findPlayer(newNextOpponentPanel.opponentOverview?.playerId);
		if (!mainPlayer) {
			console.error(
				'[bgs-next-opponent] could not find main player',
				currentState.currentTurnNumeric,
				bgState.currentGame.players,
			);
			return currentState;
		}

		// This can happen when reconnecting - the main player opponent is already decided on the "hero selection" event,
		// but the opponent event itself has not yet been sent
		if (!opponent) {
			console.warn(
				'[bgs-next-opponent] could not find opponent',
				newNextOpponentPanel.opponentOverview?.playerId,
				'is reconnect ongoing?',
				currentState.reconnectOngoing,
				'building a face-off with default values',
			);
		}

		const playerHpLeft =
			(mainPlayer.initialHealth ??
				defaultStartingHp(GameType.GT_BATTLEGROUNDS, mainPlayer?.cardId, this.allCards)) +
			(mainPlayer.currentArmor ?? 0) -
			(mainPlayer.damageTaken ?? 0);

		const opponentHpLeft =
			(opponent?.initialHealth ?? defaultStartingHp(GameType.GT_BATTLEGROUNDS, opponentCardId, this.allCards)) +
			(opponent?.currentArmor ?? 0) -
			(opponent?.damageTaken ?? 0);
		const faceOff: BgsFaceOffWithSimulation = BgsFaceOffWithSimulation.create({
			turn: currentState.getCurrentTurnAdjustedForAsyncPlay(),
			playerHpLeft: playerHpLeft,
			playerTavern: mainPlayer?.getCurrentTavernTier(),
			playerCardId: mainPlayer?.cardId,
			opponentCardId: normalizeCardId(opponentCardId, this.allCards),
			opponentPlayerId: opponentPlayerId,
			opponentHpLeft: opponentHpLeft,
			opponentTavern: opponent?.getCurrentTavernTier(),
		});
		console.debug('[bgs-next-opponent] created face-off', faceOff, event);
		if (faceOff.playerCardId === 'TB_BaconShop_HERO_PH') {
			console.error(
				'[bgs-next-opponent] created a face-off with an invalid player card',
				mainPlayer,
				opponent,
				bgState.currentGame.players.map((p) => p.cardId),
			);
		}
		const result = bgState.updatePanel(newNextOpponentPanel).update({
			currentGame: bgState.currentGame.update({
				// There shouldn't be a case where the next opponent is revelead before the board for the last fight are revealed
				// The only case that could bug this out is if a "next opponent" event is sent multiple times for the same player
				faceOffs: [...bgState.currentGame.faceOffs, faceOff],
			}),
		});
		console.debug('[bgs-next-opponent] updated face offs', faceOff, result);
		return currentState.update({
			bgState: result,
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_NEXT_OPPONENT;
	}

	private buildInGamePanel(currentState: GameState, cardId: string, playerId: number): BgsNextOpponentOverviewPanel {
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
			playerId:
				playerId ??
				// If there is no card ID, this means we face the same opponent as previously
				currentState.bgState.panels
					.filter((panel) => panel.id === 'bgs-next-opponent-overview')
					.map((panel) => panel as BgsNextOpponentOverviewPanel)[0].opponentOverview?.playerId,
			// cardId:
			// 	normalizeHeroCardId(cardId, this.allCards) ??
			// 	// If there is no card ID, this means we face the same opponent as previously
			// 	currentState.bgState.panels
			// 		.filter((panel) => panel.id === 'bgs-next-opponent-overview')
			// 		.map((panel) => panel as BgsNextOpponentOverviewPanel)[0].opponentOverview?.cardId,
		});
		const currentTurn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: opponentOverview,
			name: this.i18n.translateString('battlegrounds.in-game.opponents', {
				turn: currentTurn,
			}),
		} as BgsNextOpponentOverviewPanel);
	}
}
