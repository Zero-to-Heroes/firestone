import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsCustomSimulationResetEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-reset-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationResetProcessor implements Processor {
	public async process(
		event: BgsCustomSimulationResetEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.battlegrounds.customSimulationState.resetFaceOff();
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
