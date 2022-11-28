import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ShowMainWindowEvent } from '../events/show-main-window-event';
import { Processor } from './processor';

export class ShowMainWindowProcessor implements Processor {
	public async process(
		event: ShowMainWindowEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				isVisible: true,
			} as NavigationState),
		];
	}
}
