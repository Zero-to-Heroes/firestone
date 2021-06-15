import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsInGameStage } from '../../../../models/battlegrounds/in-game/bgs-in-game-stage';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsOpponentOverview } from '../../../../models/battlegrounds/in-game/bgs-opponent-overview';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsNextOpponentEvent } from '../events/bgs-next-opponent-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsNextOpponentParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsNextOpponentEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsNextOpponentEvent): Promise<BattlegroundsState> {
		// console.log('parsing next opponent', event);
		const newNextOpponentStage: BgsInGameStage = this.buildInGameStage(event.cardId, currentState);
		const stages: readonly BgsStage[] = currentState.stages.map((stage) =>
			stage.id === newNextOpponentStage.id ? newNextOpponentStage : stage,
		);

		const faceOff: BgsFaceOffWithSimulation = BgsFaceOffWithSimulation.create({
			turn: currentState.currentGame.currentTurn,
			playerCardId: currentState.currentGame.getMainPlayer().cardId,
			opponentCardId: normalizeHeroCardId(event.cardId),
		} as BgsFaceOffWithSimulation);
		return currentState.update({
			stages: stages,
			currentGame: currentState.currentGame.update({
				faceOffs: [...currentState.currentGame.faceOffs, faceOff] as readonly BgsFaceOffWithSimulation[],
			} as BgsGame),
		} as BattlegroundsState);
	}

	private buildInGameStage(cardId: string, currentState: BattlegroundsState): BgsInGameStage {
		const stageToRebuild =
			currentState.stages.find((stage) => stage.id === 'in-game') || this.createNewStage(currentState);
		const panelToRebuild = this.createNewPanel(currentState, cardId);

		const panels: readonly BgsPanel[] = stageToRebuild.panels.map((panel) =>
			panel.id === 'bgs-next-opponent-overview' ? panelToRebuild : panel,
		);
		return BgsInGameStage.create({
			panels: panels,
		} as BgsInGameStage);
	}

	private createNewStage(currentState: BattlegroundsState): BgsInGameStage {
		return BgsInGameStage.create({
			panels: [BgsNextOpponentOverviewPanel.create({} as BgsNextOpponentOverviewPanel)] as readonly BgsPanel[],
		} as BgsInGameStage);
	}

	private createNewPanel(currentState: BattlegroundsState, cardId: string): BgsNextOpponentOverviewPanel {
		// const nextOpponent = currentState.currentGame.players.find(player => player.cardId === cardId);
		const opponentOverview: BgsOpponentOverview = BgsOpponentOverview.create({
			// Just use the cardId, and let the UI reconstruct from the state to avoid duplicating the info
			cardId: normalizeHeroCardId(cardId),
		});
		const currentTurn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: opponentOverview,
			name: `Turn ${currentTurn} - Next opponent`,
		} as BgsNextOpponentOverviewPanel);
	}
}
