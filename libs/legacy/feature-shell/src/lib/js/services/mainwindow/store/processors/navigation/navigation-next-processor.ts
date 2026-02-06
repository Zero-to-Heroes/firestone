import { MainWindowNavigationService, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { NavigationNextEvent } from '../../events/navigation/navigation-next-event';
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
