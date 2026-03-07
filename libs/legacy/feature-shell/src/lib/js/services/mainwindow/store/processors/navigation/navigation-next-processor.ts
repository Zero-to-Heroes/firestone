import { MainWindowNavigationService, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { NavigationNextEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class NavigationNextProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: NavigationNextEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
	}
}
