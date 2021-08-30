import deepmerge from 'deepmerge';
import { BgsFaceOffWithSimulation } from '../../../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BattlegroundsAppState } from '../../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsCustomSimulationState } from '../../../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { BgsCustomSimulationUpdateEvent } from '../../../events/battlegrounds/simulator/bgs-custom-simulation-update-event';
import { Processor } from '../../processor';

export class BgsCustomSimulationUpdateProcessor implements Processor {
	public async process(
		event: BgsCustomSimulationUpdateEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('handling simulation update event', event);
		const merged = BgsFaceOffWithSimulation.create(
			deepmerge(
				event.currentFaceOff as Partial<BgsFaceOffWithSimulation>,
				event.partialUpdate as Partial<BgsFaceOffWithSimulation>,
				{
					arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
				},
			),
		);
		console.debug('merged', merged, event.currentFaceOff, event.partialUpdate);

		const newState = currentState.battlegrounds.customSimulationState.update({
			faceOff: merged,
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
