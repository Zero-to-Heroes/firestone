import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
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
