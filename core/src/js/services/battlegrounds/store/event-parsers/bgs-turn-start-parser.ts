import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsInGameStage } from '../../../../models/battlegrounds/in-game/bgs-in-game-stage';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsTurnStartEvent } from '../events/bgs-turn-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTurnStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTurnStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTurnStartEvent): Promise<BattlegroundsState> {
		const newStageId = event.turnNumber === 1 ? 'in-game' : currentState.currentStageId;
		const newPanelId = event.turnNumber === 1 ? 'bgs-next-opponent-overview' : currentState.currentPanelId;

		const newCurrentTurn = Math.ceil(event.turnNumber / 2);
		const newNextOpponentStage: BgsInGameStage = this.rebuildInGameStage(currentState, newCurrentTurn);
		const stages: readonly BgsStage[] = currentState.stages.map((stage) =>
			stage.id === newNextOpponentStage.id ? newNextOpponentStage : stage,
		);
		console.log('updating turn', newCurrentTurn);
		return currentState.update({
			currentGame: currentState.currentGame.update({
				currentTurn: newCurrentTurn,
			} as BgsGame),
			stages: stages,
			currentStageId: newStageId,
			currentPanelId: newPanelId,
		} as BattlegroundsState);
	}

	private rebuildInGameStage(currentState: BattlegroundsState, newCurrentTurn: number): BgsInGameStage {
		const stageToRebuild = currentState.stages.find((stage) => stage.id === 'in-game');
		const panelToRebuild: BgsNextOpponentOverviewPanel = (stageToRebuild.panels.find(
			(panel) => panel.id === 'bgs-next-opponent-overview',
		) as BgsNextOpponentOverviewPanel).update({
			name: `Turn ${newCurrentTurn} - Next opponent`,
		} as BgsNextOpponentOverviewPanel);

		const panels: readonly BgsPanel[] = stageToRebuild.panels.map((panel) =>
			panel.id === 'bgs-next-opponent-overview' ? panelToRebuild : panel,
		);
		return BgsInGameStage.create({
			panels: panels,
		} as BgsInGameStage);
	}
}
