import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationNextEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class NavigationNextProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: NavigationNextEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		return [null, null];
	}
}
