import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationBattlegrounds } from '../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationCollection } from '../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationReplays } from '../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { Processor } from './processor';

export class ChangeVisibleApplicationProcessor implements Processor {
	public async process(
		event: ChangeVisibleApplicationEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// if (event.module === navigationState.currentApp) {
		// 	return [null, null];
		// }
		// console.log('changing application', event);
		const binder =
			event.module === 'collection'
				? navigationState.navigationCollection.update({
						currentView: 'sets',
						menuDisplayType: 'menu',
				  } as NavigationCollection)
				: navigationState.navigationCollection;
		const achievements =
			event.module === 'achievements'
				? navigationState.navigationAchievements.update({
						currentView: 'categories',
						menuDisplayType: 'menu',
				  } as NavigationAchievements)
				: navigationState.navigationAchievements;
		const replays =
			event.module === 'replays'
				? navigationState.navigationReplays.update({
						currentView: 'list',
				  } as NavigationReplays)
				: navigationState.navigationReplays;
		const battlegrounds =
			event.module === 'battlegrounds'
				? navigationState.navigationBattlegrounds.update({
						currentView: 'categories',
						menuDisplayType: 'menu',
				  } as NavigationBattlegrounds)
				: navigationState.navigationBattlegrounds;
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: event.module,
				navigationCollection: binder,
				navigationAchievements: achievements,
				navigationReplays: replays,
				navigationBattlegrounds: battlegrounds,
				text: event.module === 'achievements' ? 'Categories' : null,
				image: null,
			} as NavigationState),
		];
	}
}
