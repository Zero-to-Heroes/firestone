import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowState, MainWindowStoreEvent, NavigationState } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class ConstructedMetaArchetypeShowDecksEvent implements MainWindowStoreEvent {
	constructor(public readonly archetypeId: number) {}

	public static eventName(): string {
		return 'ConstructedMetaArchetypeShowDecksEvent';
	}

	public eventName(): string {
		return 'ConstructedMetaArchetypeShowDecksEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class ConstructedMetaArchetypeShowDecksProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly navigation: ConstructedNavigationService,
	) {}

	public async process(
		event: ConstructedMetaArchetypeShowDecksEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...currentPrefs,
			constructedMetaDecksArchetypeFilter: [event.archetypeId],
		};
		await this.prefs.savePreferences(newPrefs);
		this.navigation.selectedConstructedMetaArchetype$$.next(null);
		this.navigation.selectedConstructedMetaDeck$$.next(null);
		this.navigation.currentView$$.next('constructed-meta-decks');
		return [null, null];
	}
}
