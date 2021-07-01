import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsCustomSimulationUpdateMinionRequestEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-update-minion-request-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationUpdateMinionRequestProcessor implements Processor {
	public async process(
		event: BgsCustomSimulationUpdateMinionRequestEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('showing minion update panel', event);
		const existingSide =
			event.side === 'player'
				? currentState.battlegrounds.customSimulationState.faceOff.battleInfo.playerBoard
				: currentState.battlegrounds.customSimulationState.faceOff.battleInfo.opponentBoard;
		const newState: BgsCustomSimulationState = currentState.battlegrounds.customSimulationState.update({
			picker: {
				type: 'minion-update',
				side: event.side,
				minionIndex: event.index == null ? existingSide.board.length : event.index,
			},
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
