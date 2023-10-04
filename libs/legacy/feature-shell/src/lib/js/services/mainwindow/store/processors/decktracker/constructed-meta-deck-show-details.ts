import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';

export class ConstructedMetaDeckDetailsShowEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'ConstructedMetaDeckDetailsShowEvent';
	}

	public eventName(): string {
		return 'ConstructedMetaDeckDetailsShowEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class ConstructedMetaDeckDetailsShowProcessor implements Processor {
	public async process(
		event: ConstructedMetaDeckDetailsShowEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					selectedConstructedMetaDeck: event.deckstring,
					currentView: 'constructed-meta-deck-details',
				}),
			}),
		];
	}
}
