import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsFaceOffWithSimulation } from '../../../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { removeFromReadonlyArray } from '../../../../../utils';
import { BgsCustomSimulationMinionRemoveRequestEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-minion-remove-request-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationMinionRemoveRequestParser implements Processor {
	public async process(
		event: BgsCustomSimulationMinionRemoveRequestEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('handling minion add event', event);
		const existingSide =
			event.side === 'player'
				? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
				: currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard;
		const newSide: BgsBoardInfo = {
			...existingSide,
			board: removeFromReadonlyArray(existingSide.board, event.minionIndex),
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
		console.debug('newBattleInfo', newBattleInfo);
		const newState: BgsCustomSimulationState = currentState.battlegrounds.customSimulationState.update({
			faceOff: currentState.battlegrounds.customSimulationState.faceOff.update({
				battleInfo: newBattleInfo,
			} as BgsFaceOffWithSimulation),
			picker: null,
		} as BgsCustomSimulationState);
		console.debug('newState', newState);
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
