import { ConstructedNavigationService } from '@firestone/constructed/common';
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
	constructor(private readonly navigation: ConstructedNavigationService) {}

	public async process(
		event: ConstructedMetaDeckDetailsShowEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.navigation.selectedConstructedMetaDeck$$.next(event.deckstring);
		this.navigation.currentView$$.next('constructed-meta-deck-details');
		return [null, null];
	}
}
