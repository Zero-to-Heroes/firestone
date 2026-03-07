import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { CloseMainWindowEvent } from '@firestone/mainwindow/common';
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
