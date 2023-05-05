import { BattlegroundsCategory } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
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
			(history.currentIndexInHistory > 0
				? history.stateHistory[history.currentIndexInHistory - 1].state
				: NavigationBackProcessor.buildParentState(navigationState, currentState)) ?? navigationState;
		if (!newState?.isVisible) {
			if (history.currentIndexInHistory !== 1) {
				// When the first event is the store init, this behavior is normal
				console.warn('[navigation-back] going back to an invisible state, auto-fixing the issue', newState);
			}
			return [null, newState.update({ ...newState, isVisible: true } as NavigationState)];
		}
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
			case 'duels':
				return NavigationBackProcessor.buildParentDuelsState(navigationState, dataState);
			case 'mercenaries':
				return NavigationBackProcessor.buildParentMercenariesState(navigationState, dataState);
			case 'arena':
				return NavigationBackProcessor.buildParentArenaState(navigationState, dataState);
			default:
				return navigationState;
		}
	}

	private static buildParentAchievementsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		switch (navigationState.navigationAchievements.currentView) {
			case 'categories':
				return null;
			case 'list':
				return null;
			default:
				return null;
		}
	}

	private static buildParentDuelsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		// console.log('building parent duels state', navigationState.navigationDuels.selectedCategoryId);
		switch (navigationState.navigationDuels.selectedCategoryId) {
			default:
				return null;
		}
	}

	private static buildParentMercenariesState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		// console.log('building parent mercenaries state', navigationState.navigationMercenaries.selectedCategoryId);
		switch (navigationState.navigationMercenaries.selectedCategoryId) {
			default:
				return null;
		}
	}

	private static buildParentArenaState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		// console.log('building parent arena state', navigationState.navigationArena.selectedCategoryId);
		switch (navigationState.navigationArena.selectedCategoryId) {
			default:
				return null;
		}
	}

	private static buildParentBattlegroundsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		// console.log('building parent battelgrounds state', navigationState.navigationBattlegrounds.currentView);
		switch (navigationState.navigationBattlegrounds.currentView) {
			case 'categories':
				return null;
			case 'category':
				return null;
			case 'list':
				const currentCategory: BattlegroundsCategory = dataState.battlegrounds?.findCategory(
					navigationState.navigationBattlegrounds.selectedCategoryId,
				);
				console.log(
					'currentCategory',
					currentCategory?.id,
					navigationState.navigationBattlegrounds.selectedCategoryId,
				);
				return navigationState.update({
					navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
						menuDisplayType: 'menu',
						currentView: 'list',
						selectedCategoryId: currentCategory?.id,
					} as NavigationBattlegrounds),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					text: null,
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
					(set) => set.getCard(navigationState.navigationCollection.selectedCardId) != null,
				);
				console.log('selected set', selectedSet?.id);
				return navigationState.update({
					navigationCollection: navigationState.navigationCollection.update({
						currentView: 'cards',
						selectedSetId: selectedSet?.id,
						cardList: selectedSet?.allCards,
					} as NavigationCollection),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					text: selectedSet?.name,
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
		switch (navigationState.navigationReplays?.currentView) {
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
