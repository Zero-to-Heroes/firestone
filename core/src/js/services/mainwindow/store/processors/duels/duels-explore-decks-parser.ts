import { CardIds } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Preferences } from '@models/preferences';
import { DuelsExploreDecksEvent } from '@services/mainwindow/store/events/duels/duels-explore-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { PreferencesService } from '@services/preferences.service';

export class DuelsExploreDecksParser implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsExploreDecksEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			duelsActiveHeroesFilter: [event.heroCardId as CardIds],
			duelsActiveHeroPowerFilter: event.heroPowerCardId,
			duelsActiveSignatureTreasureFilter: event.signatureTreasureCardId,
		};
		await this.prefs.savePreferences(newPrefs);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'duels',
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-top-decks',
				}),
			}),
		];
	}
}
