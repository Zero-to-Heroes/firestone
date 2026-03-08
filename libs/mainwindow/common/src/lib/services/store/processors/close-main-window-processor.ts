import {
	CloseMainWindowEvent,
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
} from '../store-internal';
import { Processor } from './processor';

export class CloseMainWindowProcessor implements Processor {
	constructor(private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: CloseMainWindowEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.mainNav.isVisible$$.next(false);
		return [null, null];
	}
}
