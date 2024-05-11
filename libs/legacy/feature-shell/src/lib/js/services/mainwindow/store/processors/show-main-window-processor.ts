import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ShowMainWindowEvent } from '../events/show-main-window-event';
import { Processor } from './processor';

export class ShowMainWindowProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: ShowMainWindowEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		this.mainNav.isVisible$$.next(true);
		return [null, null];
	}
}
