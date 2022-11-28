import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { CurrentUserEvent } from '../events/current-user-event';
import { Processor } from './processor';

export class CurrentUserProcessor implements Processor {
	public async process(
		event: CurrentUserEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('assigning current user', event.currentUser);
		return [
			currentState.update({
				currentUser: event.currentUser,
			} as MainWindowState),
			null,
		];
	}
}
