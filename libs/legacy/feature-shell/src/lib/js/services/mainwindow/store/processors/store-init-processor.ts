import { AchievementsNavigationService } from '@firestone/achievements/common';
import { ArenaNavigationService } from '@firestone/arena/common';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { CollectionNavigationService } from '@firestone/collection/common';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../events.service';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { StoreInitEvent } from '../events/store-init-event';
import { ChangeVisibleApplicationProcessor } from './change-visible-application-processor';
import { Processor } from './processor';

export class StoreInitProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly battlegroundsNav: BattlegroundsNavigationService,
		private readonly constructedNav: ConstructedNavigationService,
		private readonly achievementsNav: AchievementsNavigationService,
		private readonly arenaNav: ArenaNavigationService,
	) {}

	public async process(
		event: StoreInitEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const navState = await this.buildCurrentAppNavState(currentState, navigationState, prefs);
		console.debug('[store-init] emitting STORE_READY event');
		this.events.broadcast(Events.STORE_READY);
		return [currentState, navState];
	}

	private async buildCurrentAppNavState(
		currentState: MainWindowState,
		navigationState: NavigationState,
		prefs: Preferences,
	): Promise<NavigationState> {
		const currentNavApp = this.mainNav.currentApp$$.value;
		// Don't change it if the user has already started to navigate
		if (currentNavApp) {
			return navigationState;
		}

		const currentAppFromPrefs = prefs.currentMainVisibleSection;
		if (currentAppFromPrefs) {
			const [, navState] = await new ChangeVisibleApplicationProcessor(
				this.prefs,
				this.i18n,
				this.mainNav,
				this.collectionNav,
				this.battlegroundsNav,
				this.constructedNav,
				this.achievementsNav,
				this.arenaNav,
			).process(new ChangeVisibleApplicationEvent(currentAppFromPrefs), currentState, navigationState);
			return navState;
		}

		const currentApp = !prefs.ftue.hasSeenGlobalFtue ? undefined : this.mainNav.currentApp$$.value ?? 'decktracker';
		this.mainNav.currentApp$$.next(currentApp);
		return navigationState;
	}
}
