import { AchievementsNavigationService } from '@firestone/achievements/common';
import { ArenaNavigationService } from '@firestone/arena/common';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { CollectionNavigationService } from '@firestone/collection/common';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationDecktracker } from '../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationReplays } from '../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { Processor } from './processor';

export class ChangeVisibleApplicationProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly bgNav: BattlegroundsNavigationService,
		private readonly constructedNav: ConstructedNavigationService,
		private readonly achievementsNav: AchievementsNavigationService,
		private readonly arenaNav: ArenaNavigationService,
	) {}

	public async process(
		event: ChangeVisibleApplicationEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// if (event.module === navigationState.currentApp) {
		// 	return [null, null];
		// }
		if (event.module === 'collection') {
			this.collectionNav.currentView$$.next('sets');
			this.collectionNav.menuDisplayType$$.next('menu');
		} else if (event.module === 'battlegrounds') {
			this.bgNav.selectedCategoryId$$.next('bgs-category-meta-heroes');
			this.bgNav.currentView$$.next('list');
			this.bgNav.menuDisplayType$$.next('menu');
		} else if (event.module === 'decktracker') {
			this.constructedNav.currentView$$.next('decks');
			this.constructedNav.selectedDeckstring$$.next(null);
		} else if (event.module === 'achievements') {
			this.achievementsNav.currentView$$.next('categories');
			this.achievementsNav.menuDisplayType$$.next('menu');
			this.achievementsNav.selectedCategoryId$$.next(null);
		} else if (event.module === 'arena') {
			this.arenaNav.menuDisplayType$$.next('menu');
			this.arenaNav.expandedRunIds$$.next([]);
		}

		const achievements =
			event.module === 'achievements'
				? navigationState.navigationAchievements.update({
						selectedAchievementId: undefined,
				  } as NavigationAchievements)
				: navigationState.navigationAchievements;
		const replays =
			event.module === 'replays'
				? navigationState.navigationReplays.update({
						currentView: 'list',
						selectedReplay: undefined,
				  } as NavigationReplays)
				: navigationState.navigationReplays;
		const decktracker =
			event.module === 'decktracker'
				? navigationState.navigationDecktracker.update({
						menuDisplayType: 'menu',
				  } as NavigationDecktracker)
				: navigationState.navigationDecktracker;
		// TODO: if this is the live tab, default to the decktracker
		await this.prefs.setMainVisibleSection(event.module === 'live' ? 'decktracker' : event.module);
		this.mainNav.text$$.next(this.getInitialText(event.module));
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(event.forceApplicationVisible || this.mainNav.isVisible$$.getValue());
		this.mainNav.currentApp$$.next(event.module);
		return [
			null,
			navigationState.update({
				navigationAchievements: achievements,
				navigationReplays: replays,
				navigationDecktracker: decktracker,
			} as NavigationState),
		];
	}

	private getInitialText(module: string): string {
		switch (module) {
			case 'achievements':
				return this.i18n.translateString('app.achievements.menu.categories');
			case 'decktracker':
				return this.i18n.translateString('app.achievements.menu.decks-header');
			default:
				return null;
		}
	}
}
