import { Processor } from './processor';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { CloseMainWindowEvent } from '../events/close-main-window-event';

export class CloseMainWindowProcessor implements Processor {
	public async process(event: CloseMainWindowEvent, currentState: MainWindowState): Promise<MainWindowState> {
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: false,
		} as MainWindowState);
	}
}
