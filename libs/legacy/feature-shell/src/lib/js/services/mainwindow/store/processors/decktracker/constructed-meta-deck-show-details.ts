import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '@services/mainwindow/store/processors/processor';

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
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.navigation.selectedConstructedMetaDeck$$.next(event.deckstring);
		this.navigation.currentView$$.next('constructed-meta-deck-details');
		return [null, null];
	}
}
