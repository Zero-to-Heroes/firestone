import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsCustomSimulationCloseSidePanelEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-close-side-panel-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationCloseSidePanelProcessor implements Processor {
	public async process(
		event: BgsCustomSimulationCloseSidePanelEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState: BgsCustomSimulationState = currentState.battlegrounds.customSimulationState.update({
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
