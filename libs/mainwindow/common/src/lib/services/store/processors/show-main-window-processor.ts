import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
	ShowMainWindowEvent,
} from '../store-internal';
import { Processor } from './processor';

export class ShowMainWindowProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: ShowMainWindowEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.mainNav.isVisible$$.next(true);
		return [null, null];
	}
}
