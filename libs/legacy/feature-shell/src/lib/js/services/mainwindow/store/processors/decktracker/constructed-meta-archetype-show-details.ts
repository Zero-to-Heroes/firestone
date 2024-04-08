import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';

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
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.navigation.selectedConstructedMetaArchetype$$.next(event.id);
		this.navigation.currentView$$.next('constructed-meta-archetype-details');
		return [null, null];
	}
}
