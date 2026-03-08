import { ConstructedNavigationService } from '@firestone/constructed/common';
import {
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class ConstructedMetaArchetypeDetailsShowEvent implements MainWindowStoreEvent {
	constructor(public readonly id: number) {}

	public static eventName(): string {
		return 'ConstructedMetaArchetypeDetailsShowEvent';
	}

	public eventName(): string {
		return 'ConstructedMetaArchetypeDetailsShowEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class ConstructedMetaArchetypeDetailsShowProcessor implements Processor {
	constructor(private readonly navigation: ConstructedNavigationService) {}

	public async process(
		event: ConstructedMetaArchetypeDetailsShowEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.navigation.selectedConstructedMetaArchetype$$.next(event.id);
		this.navigation.currentView$$.next('constructed-meta-archetype-details');
		return [null, null];
	}
}
