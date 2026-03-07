import { AchievementsNavigationService } from '@firestone/achievements/common';
import { ArenaNavigationService } from '@firestone/arena/common';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { CollectionNavigationService } from '@firestone/collection/common';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowNavigationService, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ChangeVisibleApplicationEvent } from '@firestone/mainwindow/common';
import { ChangeVisibleApplicationProcessor } from './change-visible-application-processor';

export class StoreInitProcessor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly battlegroundsNav: BattlegroundsNavigationService,
		private readonly constructedNav: ConstructedNavigationService,
		private readonly achievementsNav: AchievementsNavigationService,
		private readonly arenaNav: ArenaNavigationService,
	) {}

	public async buildInitialNavigationState(
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<NavigationState> {
		const prefs = await this.prefs.getPreferences();
		const navState = await this.buildCurrentAppNavState(currentState, navigationState, prefs);
		return navState;
	}

	public async buildCurrentAppNavState(
		currentState: MainWindowState,
		navigationState: NavigationState,
		prefs: Preferences,
	): Promise<NavigationState> {
		await waitForReady(this.mainNav);

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

		const currentApp = !prefs.ftue.hasSeenGlobalFtue
			? undefined
			: (this.mainNav.currentApp$$.value ?? 'decktracker');
		this.mainNav.currentApp$$.next(currentApp);
		return navigationState;
	}
}
