import { ConstructedNavigationService } from '@firestone/constructed/common';
import {
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

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
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.navigation.selectedConstructedMetaDeck$$.next(event.deckstring);
		this.navigation.currentView$$.next('constructed-meta-deck-details');
		return [null, null];
	}
}
