import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { CurrentUserEvent } from '../events/current-user-event';
import { Processor } from './processor';

export class CurrentUserProcessor implements Processor {
	public async process(event: CurrentUserEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('assigning current user', event.currentUser);
		return Object.assign(new MainWindowState(), currentState, {
			currentUser: event.currentUser,
		} as MainWindowState);
	}
}
