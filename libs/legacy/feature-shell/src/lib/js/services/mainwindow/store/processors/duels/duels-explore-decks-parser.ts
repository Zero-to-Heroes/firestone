import { CardIds, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsExploreDecksEvent } from '@services/mainwindow/store/events/duels/duels-explore-decks-event';
import { Processor } from '@services/mainwindow/store/processors/processor';

export class DuelsExploreDecksParser implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly mainNav: MainWindowNavigationService) {}

	public async process(
		event: DuelsExploreDecksEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			duelsActiveHeroesFilter2: !!event.heroCardId ? [normalizeDuelsHeroCardId(event.heroCardId) as CardIds] : [],
			duelsActiveHeroPowerFilter2: !!event.heroPowerCardId ? [event.heroPowerCardId] : [],
			duelsActiveSignatureTreasureFilter2: !!event.signatureTreasureCardId ? [event.signatureTreasureCardId] : [],
		};
		console.debug('newPrefs', newPrefs);
		await this.prefs.savePreferences(newPrefs);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('duels');
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: 'duels-top-decks',
				}),
			}),
		];
	}
}
