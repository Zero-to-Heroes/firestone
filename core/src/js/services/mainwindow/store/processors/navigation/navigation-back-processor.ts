import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { NavigationBackEvent } from '../../events/navigation/navigation-back-event';
import { NavigationHistory } from '../../navigation-history';
import { Processor } from '../processor';

export class NavigationBackProcessor implements Processor {
	public async process(
		event: NavigationBackEvent,
		currentState: MainWindowState,
		history: NavigationHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState =
			history.currentIndexInHistory > 0
				? NavigationBackProcessor.buildParentState(navigationState, currentState)
				: history.stateHistory[history.currentIndexInHistory - 1].state;
		return [null, newState];
	}

	public static buildParentState(navigationState: NavigationState, dataState: MainWindowState): NavigationState {
		switch (navigationState.currentApp) {
			case 'achievements':
				return NavigationBackProcessor.buildParentAchievementsState(navigationState, dataState);
			case 'collection':
				return NavigationBackProcessor.buildParentCollectionState(navigationState, dataState);
			case 'decktracker':
				return NavigationBackProcessor.buildParentDecktrackerState(navigationState, dataState);
			case 'replays':
				return NavigationBackProcessor.buildParentReplaysState(navigationState, dataState);
			case 'battlegrounds':
				return NavigationBackProcessor.buildParentBattlegroundsState(navigationState, dataState);
			default:
				return navigationState;
		}
	}

	private static buildParentAchievementsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			console.warn('Missing state for processing back navigation', navigationState, dataState);
			return null;
		}
		switch (navigationState.navigationAchievements.currentView) {
			case 'categories':
				return null;
			case 'category':
				return navigationState.update({
					navigationAchievements: navigationState.navigationAchievements.update({
						currentView: 'categories',
					} as NavigationAchievements),
					text: 'Categories',
				} as NavigationState);
			case 'list':
				const category = dataState.achievements.globalCategories.find(
					cat => cat.id === navigationState.navigationAchievements.selectedGlobalCategoryId,
				);
				if (category.achievementSets.length === 1) {
					return navigationState.update({
						navigationAchievements: navigationState.navigationAchievements.update({
							currentView: 'categories',
						} as NavigationAchievements),
						text: 'Categories',
					} as NavigationState);
				}
				return navigationState.update({
					navigationAchievements: navigationState.navigationAchievements.update({
						currentView: 'category',
					} as NavigationAchievements),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					text: dataState.achievements.globalCategories.find(
						cat => cat.id === navigationState.navigationAchievements.selectedGlobalCategoryId,
					).name,
				} as NavigationState);
			default:
				return null;
		}
	}

	private static buildParentBattlegroundsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			console.warn('Missing state for processing back navigation', navigationState, dataState);
			return null;
		}
		switch (navigationState.navigationBattlegrounds.currentView) {
			case 'categories':
				return null;
			case 'category':
				return navigationState.update({
					navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
						currentView: 'categories',
					} as NavigationBattlegrounds),
					text: 'Categories',
				} as NavigationState);
			case 'list':
				const category = dataState.battlegrounds.globalCategories.find(
					cat => cat.id === navigationState.navigationBattlegrounds.selectedGlobalCategoryId,
				);
				if (category.categories.length === 1) {
					return navigationState.update({
						navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
							currentView: 'categories',
						} as NavigationBattlegrounds),
						text: 'Categories',
					} as NavigationState);
				}
				return navigationState.update({
					navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
						currentView: 'category',
					} as NavigationBattlegrounds),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					text: dataState.battlegrounds.globalCategories.find(
						cat => cat.id === navigationState.navigationBattlegrounds.selectedGlobalCategoryId,
					).name,
				} as NavigationState);
			default:
				return null;
		}
	}

	private static buildParentCollectionState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!dataState) {
			return null;
		}
		switch (navigationState.navigationCollection.currentView) {
			case 'sets':
				return null;
			case 'cards':
				return navigationState.update({
					navigationCollection: navigationState.navigationCollection.update({
						currentView: 'sets',
					} as NavigationCollection),
					text: null,
				} as NavigationState);
			case 'card-details':
				const selectedSet = dataState.binder.allSets.find(
					set =>
						set.allCards.find(card => card.id === navigationState.navigationCollection.selectedCardId) !=
						null,
				);
				console.log('selected set', selectedSet);
				return navigationState.update({
					navigationCollection: navigationState.navigationCollection.update({
						currentView: 'cards',
						selectedSetId: selectedSet.id,
						cardList: selectedSet.allCards,
					} as NavigationCollection),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					text: selectedSet.name,
				} as NavigationState);
			default:
				return null;
		}
	}

	private static buildParentDecktrackerState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		return null;
	}

	private static buildParentReplaysState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		switch (navigationState.navigationReplays.currentView) {
			case 'list':
				return null;
			case 'match-details':
				return navigationState.update({
					navigationReplays: navigationState.navigationReplays.update({
						currentView: 'list',
					} as NavigationReplays),
					text: null,
				} as NavigationState);
			default:
				return null;
		}
	}
}
