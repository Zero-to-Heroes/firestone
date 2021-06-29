import { GameType } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsOpponentOverview } from '../../../../models/battlegrounds/in-game/bgs-opponent-overview';
import { defaultStartingHp } from '../../../hs-utils';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsNextOpponentParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsNextOpponentEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsNextOpponentEvent): Promise<BattlegroundsState> {
		console.debug('parsing next opponent', event);
		const newNextOpponentPanel: BgsNextOpponentOverviewPanel = this.buildInGamePanel(currentState, event.cardId);
		const panels: readonly BgsPanel[] = currentState.panels.map((stage) =>
			stage.id === newNextOpponentPanel.id ? newNextOpponentPanel : stage,
		);

		const mainPlayer = currentState.currentGame.getMainPlayer();
		const opponent = currentState.currentGame.players.find(
			(player) => player.getNormalizedHeroCardId() === newNextOpponentPanel.opponentOverview?.cardId,
		);
		//console.debug('mainPlayer', mainPlayer, opponent);
		if (!mainPlayer || !opponent) {
			return currentState;
		}

		//console.debug('face off players', mainPlayer, opponent, currentState);
		const faceOff: BgsFaceOffWithSimulation = BgsFaceOffWithSimulation.create({
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
			playerCardId: mainPlayer?.cardId,
			playerHpLeft:
				(mainPlayer?.initialHealth ?? defaultStartingHp(GameType.GT_BATTLEGROUNDS, mainPlayer?.cardId)) -
				(mainPlayer?.damageTaken ?? 0),
			playerTavern: mainPlayer?.getCurrentTavernTier(),
			opponentCardId: opponent?.getNormalizedHeroCardId(),
			opponentHpLeft:
				(opponent?.initialHealth ?? defaultStartingHp(GameType.GT_BATTLEGROUNDS, opponent?.cardId)) -
				(opponent?.damageTaken ?? 0),
			opponentTavern: opponent?.getCurrentTavernTier(),
		} as BgsFaceOffWithSimulation);
		//console.debug('created new face off', faceOff, currentState);
		return currentState.update({
			panels: panels,
			currentGame: currentState.currentGame.update({
				faceOffs: [...currentState.currentGame.faceOffs, faceOff] as readonly BgsFaceOffWithSimulation[],
			} as BgsGame),
		} as BattlegroundsState);
	}

	private buildInGamePanel(currentState: BattlegroundsState, cardId: string): BgsNextOpponentOverviewPanel {
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
			cardId:
				normalizeHeroCardId(cardId) ??
				// If there is no card ID, this means we face the same opponent as previously
				currentState.panels
					.filter((panel) => panel.id === 'bgs-next-opponent-overview')
					.map((panel) => panel as BgsNextOpponentOverviewPanel)[0].opponentOverview?.cardId,
		});
		const currentTurn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: opponentOverview,
			name: `Turn ${currentTurn} - Next opponent`,
		} as BgsNextOpponentOverviewPanel);
	}
}
