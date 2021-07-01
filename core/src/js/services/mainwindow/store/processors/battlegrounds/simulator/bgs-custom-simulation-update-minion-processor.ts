import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '../../../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { replaceInArray } from '../../../../../utils';
import { BgsCustomSimulationUpdateMinionEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-update-minion-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationUpdateMinionProcessor implements Processor {
	public async process(
		event: BgsCustomSimulationUpdateMinionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const existingSide =
			event.side === 'player'
				? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
				: currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard;
		const existingMinion: BoardEntity = existingSide.board[event.index];
		const newMinion: BoardEntity = {
			...existingMinion,
			...event.entity,
		};
		const newSide: BgsBoardInfo = {
			...existingSide,
			board: replaceInArray(existingSide.board, event.index, newMinion),
		};
		console.debug('newSide', newSide);
		const newBattleInfo: BgsBattleInfo = {
			...currentState.battlegrounds.customSimulationState.faceOff.battleInfo,
			opponentBoard:
				event.side === 'player'
					? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard
					: newSide,
			playerBoard:
				event.side === 'opponent'
					? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
					: newSide,
		};
		const newState: BgsCustomSimulationState = currentState.battlegrounds.customSimulationState.update({
			faceOff: currentState.battlegrounds.customSimulationState.faceOff.update({
				battleInfo: newBattleInfo,
			} as BgsFaceOffWithSimulation),
			picker: null,
		} as BgsCustomSimulationState);
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					customSimulationState: newState,
				} as BattlegroundsAppState),
			} as MainWindowState),
			null,
		];
	}
}
