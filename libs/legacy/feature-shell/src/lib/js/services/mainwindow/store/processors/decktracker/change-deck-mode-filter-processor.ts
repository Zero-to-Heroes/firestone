import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { ChangeDeckModeFilterEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	public async process(
		event: ChangeDeckModeFilterEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
	}
}
