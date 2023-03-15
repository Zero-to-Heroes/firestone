import { defaultStartingHp, GameType, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsBattlesPanel } from '../../../../models/battlegrounds/in-game/bgs-battles-panel';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsOpponentOverview } from '../../../../models/battlegrounds/in-game/bgs-opponent-overview';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsNextOpponentParser implements EventParser {
	constructor(private readonly i18n: LocalizationFacadeService, private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsNextOpponentEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsNextOpponentEvent): Promise<BattlegroundsState> {
		console.log('[bgs-next-opponent] parsing next opponent', event.cardId);
		const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.buildInGamePanel(currentState, event.cardId);

		const mainPlayer = currentState.currentGame.getMainPlayer();
		const opponent = currentState.currentGame.players.find(
			(player) => player.getNormalizedHeroCardId(this.allCards) === newNextOpponentPanel.opponentOverview?.cardId,
		);
		if (!mainPlayer || !opponent) {
			return currentState;
		}

		const faceOff: BgsFaceOffWithSimulation = BgsFaceOffWithSimulation.create({
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
			playerCardId: mainPlayer?.cardId,
			playerHpLeft:
				(mainPlayer?.initialHealth ??
					defaultStartingHp(GameType.GT_BATTLEGROUNDS, mainPlayer?.cardId, this.allCards)) -
				(mainPlayer?.damageTaken ?? 0),
			playerTavern: mainPlayer?.getCurrentTavernTier(),
			opponentCardId: opponent?.getNormalizedHeroCardId(this.allCards),
			opponentHpLeft:
				(opponent?.initialHealth ??
					defaultStartingHp(GameType.GT_BATTLEGROUNDS, opponent?.cardId, this.allCards)) -
				(opponent?.damageTaken ?? 0),
			opponentTavern: opponent?.getCurrentTavernTier(),
		} as BgsFaceOffWithSimulation);
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
						selectedFaceOffId: faceOff.id,
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
		return result;
	}

	private buildInGamePanel(currentState: BattlegroundsState, cardId: string): BgsNextOpponentOverviewPanel {
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
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
