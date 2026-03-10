import { ConstructedNavigationService } from '@firestone/constructed/common';
import {
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from '../../store-internal';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../processor';

export class ConstructedMetaArchetypeShowDecksEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedMetaArchetypeShowDecksEvent.eventName

	constructor(public readonly archetypeId: number) {}

	static readonly eventName = 'ConstructedMetaArchetypeShowDecksEvent'
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
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
