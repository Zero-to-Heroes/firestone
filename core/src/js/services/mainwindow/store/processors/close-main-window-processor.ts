import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { CloseMainWindowEvent } from '../events/close-main-window-event';
import { Processor } from './processor';

export class CloseMainWindowProcessor implements Processor {
	public async process(
		event: CloseMainWindowEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				isVisible: false,
			} as NavigationState),
		];
	}
}
