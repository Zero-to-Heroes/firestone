import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsAppInitEvent } from '../../events/battlegrounds/bgs-app-init-event';
import { Processor } from '../processor';

export class BgsAppInitProcessor implements Processor {
	constructor() {}

	public async process(
		event: BgsAppInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const battlegrounds = event.battlegroundsAppState;
		return [
			Object.assign(new MainWindowState(), currentState, {
				battlegrounds: battlegrounds,
			} as MainWindowState),
			null,
		];
	}
}
