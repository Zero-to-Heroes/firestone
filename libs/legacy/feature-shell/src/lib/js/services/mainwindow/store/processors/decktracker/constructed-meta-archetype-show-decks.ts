import { ConstructedNavigationService } from '@firestone/constructed/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';

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
		history,
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
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					currentView: 'constructed-meta-decks',
				}),
			}),
		];
	}
}
