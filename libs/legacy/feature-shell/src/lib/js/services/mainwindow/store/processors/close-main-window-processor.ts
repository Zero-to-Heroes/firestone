import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { CloseMainWindowEvent } from '../events/close-main-window-event';
import { Processor } from './processor';

export class CloseMainWindowProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: CloseMainWindowEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		this.mainNav.isVisible$$.next(false);
		return [null, null];
	}
}
