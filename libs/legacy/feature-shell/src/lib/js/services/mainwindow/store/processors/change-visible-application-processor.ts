import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { CollectionNavigationService } from '@firestone/collection/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationArena } from '../../../../models/mainwindow/navigation/navigation-arena';
import { NavigationBattlegrounds } from '../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationDecktracker } from '../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationDuels } from '../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationReplays } from '../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { Processor } from './processor';

export class ChangeVisibleApplicationProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly nav: BattlegroundsNavigationService,
	) {}

	public async process(
		event: ChangeVisibleApplicationEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// if (event.module === navigationState.currentApp) {
		// 	return [null, null];
		// }
		if (event.module === 'collection') {
			this.collectionNav.currentView$$.next('sets');
			this.collectionNav.menuDisplayType$$.next('menu');
		}
		if (event.module === 'battlegrounds') {
			this.nav.selectedCategoryId$$.next('bgs-category-meta-heroes');
		}

		const achievements =
			event.module === 'achievements'
				? navigationState.navigationAchievements.update({
						currentView: 'categories',
						menuDisplayType: 'menu',
						selectedCategoryId: undefined,
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
		const battlegrounds =
			event.module === 'battlegrounds'
				? navigationState.navigationBattlegrounds.update({
						currentView: 'list',
						menuDisplayType: 'menu',
				  } as NavigationBattlegrounds)
				: navigationState.navigationBattlegrounds;
		const duels =
			event.module === 'duels'
				? navigationState.navigationDuels.update({
						selectedCategoryId: 'duels-runs',
						menuDisplayType: 'menu',
						expandedRunIds: [] as readonly string[],
						treasureSearchString: null,
				  } as NavigationDuels)
				: navigationState.navigationDuels;
		const arena =
			event.module === 'arena'
				? navigationState.navigationArena.update({
						menuDisplayType: 'menu',
						expandedRunIds: [] as readonly string[],
				  } as NavigationArena)
				: navigationState.navigationArena;
		const decktracker =
			event.module === 'decktracker'
				? navigationState.navigationDecktracker.update({
						currentView: 'decks',
						menuDisplayType: 'menu',
						selectedDeckstring: null,
				  } as NavigationDecktracker)
				: navigationState.navigationBattlegrounds;
		// TODO: if this is the live tab, default to the decktracker
		await this.prefs.setMainVisibleSection(event.module === 'live' ? 'decktracker' : event.module);
		return [
			null,
			navigationState.update({
				isVisible: event.forceApplicationVisible || navigationState.isVisible,
				currentApp: event.module,
				navigationAchievements: achievements,
				navigationReplays: replays,
				navigationBattlegrounds: battlegrounds,
				navigationDuels: duels,
				navigationDecktracker: decktracker,
				navigationArena: arena,
				text: this.getInitialText(event.module),
				image: null,
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
