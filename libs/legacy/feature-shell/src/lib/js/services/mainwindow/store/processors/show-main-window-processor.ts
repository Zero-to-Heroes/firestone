import { MainWindowNavigationService, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { ShowMainWindowEvent } from '@firestone/mainwindow/common';
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
