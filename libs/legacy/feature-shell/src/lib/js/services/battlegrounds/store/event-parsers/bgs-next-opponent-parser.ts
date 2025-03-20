import { normalizeCardId } from '@components/battlegrounds/post-match/card-utils';
import { defaultStartingHp, GameType, normalizeHeroCardId } from '@firestone-hs/reference-data';
import {
	BattlegroundsState,
	BgsBattlesPanel,
	BgsFaceOffWithSimulation,
	BgsNextOpponentOverviewPanel,
	BgsOpponentOverview,
	BgsPanel,
} from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { EventParser } from './_event-parser';

export class BgsNextOpponentParser implements EventParser {
	constructor(private readonly i18n: LocalizationFacadeService, private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsNextOpponentEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsNextOpponentEvent): Promise<BattlegroundsState> {
		const currentNextOpponent = currentState.currentGame.lastFaceOff()?.opponentPlayerId;
		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		if (currentState.currentGame.lastFaceOff()?.turn === turn && currentNextOpponent === event.playerId) {
			console.debug(
				'[bgs-next-opponent] ignoring duplicate next opponent event',
				turn,
				currentNextOpponent,
				event,
				currentState,
			);
			return currentState;
		}

		const opponentCardId = event.isSameOpponent ? currentState.currentGame.lastOpponentCardId : event.cardId;
		const opponentPlayerId = event.isSameOpponent ? currentState.currentGame.lastOpponentPlayerId : event.playerId;
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

		const mainPlayer = currentState.currentGame.getMainPlayer();
		const opponent = currentState.currentGame.findPlayer(newNextOpponentPanel.opponentOverview?.playerId);
		if (!mainPlayer) {
			console.error('[bgs-next-opponent] could not find main player', currentState.currentGame.players);
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
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
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
				currentState.currentGame.players.map((p) => p.cardId),
			);
		}
		const battlesPanel: BgsBattlesPanel = currentState.panels.find(
			(p: BgsPanel) => p.id === 'bgs-battles',
		) as BgsBattlesPanel;
		const newBattlesPanel =
			!!battlesPanel?.selectedFaceOffId || battlesPanel.closedManually
				? battlesPanel
				: // Show the simulator by default when going into the Simulator tab, if it's the first time
				  battlesPanel.update({
						// selectedFaceOffId: faceOff.id,
				  } as BgsBattlesPanel);
		const result = currentState
			.updatePanel(newBattlesPanel)
			.updatePanel(newNextOpponentPanel)
			.update({
				currentGame: currentState.currentGame.update({
					// There shouldn't be a case where the next opponent is revelead before the board for the last fight are revealed
					// The only case that could bug this out is if a "next opponent" event is sent multiple times for the same player
					faceOffs: [...currentState.currentGame.faceOffs, faceOff],
				}),
			} as BattlegroundsState);
		console.debug('[bgs-next-opponent] updated face offs', faceOff, result);
		return result;
	}

	private buildInGamePanel(
		currentState: BattlegroundsState,
		cardId: string,
		playerId: number,
	): BgsNextOpponentOverviewPanel {
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
			playerId:
				playerId ??
				// If there is no card ID, this means we face the same opponent as previously
				currentState.panels
					.filter((panel) => panel.id === 'bgs-next-opponent-overview')
					.map((panel) => panel as BgsNextOpponentOverviewPanel)[0].opponentOverview?.playerId,
			cardId:
				normalizeHeroCardId(cardId, this.allCards) ??
				// If there is no card ID, this means we face the same opponent as previously
				currentState.panels
					.filter((panel) => panel.id === 'bgs-next-opponent-overview')
					.map((panel) => panel as BgsNextOpponentOverviewPanel)[0].opponentOverview?.cardId,
		});
		const currentTurn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: opponentOverview,
			name: this.i18n.translateString('battlegrounds.in-game.opponents', {
				turn: currentTurn,
			}),
		} as BgsNextOpponentOverviewPanel);
	}
}
