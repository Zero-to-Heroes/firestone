import { AchievementsNavigationService } from '@firestone/achievements/common';
import { CollectionNavigationService } from '@firestone/collection/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { builCategoryHierarchy } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { SetsManagerService } from '../../../../collection/sets-manager.service';
import { NavigationBackEvent } from '../../events/navigation/navigation-back-event';
import { Processor } from '../processor';

export class NavigationBackProcessor implements Processor {
	constructor(
		private readonly setsManager: SetsManagerService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly achievementsNav: AchievementsNavigationService,
		private readonly achievementsState: AchievementsStateManagerService,
	) {}

	public async process(
		event: NavigationBackEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState =
			NavigationBackProcessor.buildParentState(
				navigationState,
				currentState,
				this.setsManager,
				this.mainNav,
				this.collectionNav,
				this.achievementsNav,
				this.achievementsState,
			) ?? navigationState;

		// 	(history.currentIndexInHistory > 0
		// 		? history.stateHistory[history.currentIndexInHistory - 1].state
		// 		: NavigationBackProcessor.buildParentState(
		// 				navigationState,
		// 				currentState,
		// 				this.setsManager,
		// 				this.mainNav,
		// 				this.collectionNav,
		// 		  )) ?? navigationState;
		// if (!newState?.isVisible) {
		// 	if (history.currentIndexInHistory !== 1) {
		// 		// When the first event is the store init, this behavior is normal
		// 		console.warn('[navigation-back] going back to an invisible state, auto-fixing the issue', newState);
		// 	}
		// 	return [null, newState.update({ ...newState, isVisible: true } as NavigationState)];
		// }
		return [null, newState];
	}

	public static buildParentState(
		navigationState: NavigationState,
		dataState: MainWindowState,
		setsManager: SetsManagerService,
		mainNav: MainWindowNavigationService,
		collectionNav: CollectionNavigationService,
		achievementsNav: AchievementsNavigationService,
		achievementsState: AchievementsStateManagerService,
	): NavigationState {
		switch (navigationState.currentApp) {
			case 'achievements':
				achievementsNav.goUp();
				return NavigationBackProcessor.buildParentAchievementsState(
					navigationState,
					dataState,
					achievementsState,
					mainNav,
					achievementsNav,
				);
			case 'collection':
				collectionNav.goUp();
				return NavigationBackProcessor.buildParentCollectionState(
					navigationState,
					setsManager,
					mainNav,
					collectionNav,
				);
			case 'decktracker':
				return NavigationBackProcessor.buildParentDecktrackerState(navigationState, dataState);
			case 'replays':
				return NavigationBackProcessor.buildParentReplaysState(navigationState, dataState, mainNav);
			case 'battlegrounds':
				return NavigationBackProcessor.buildParentBattlegroundsState(navigationState, dataState, mainNav);
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
		achievementsState: AchievementsStateManagerService,
		mainNav: MainWindowNavigationService,
		achievementsNav: AchievementsNavigationService,
	): NavigationState {
		const groupedAchievements = achievementsState.groupedAchievements$$.getValue();
		const categoryId = achievementsNav.selectedCategoryId$$.getValue()?.split('/').pop();
		const hierarchy = builCategoryHierarchy(categoryId, groupedAchievements);
		mainNav.text$$.next(hierarchy?.categories?.map((cat) => cat.name).join(' › '));
		return null;
	}

	private static buildParentDuelsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
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
		// switch (navigationState.navigationArena.selectedCategoryId) {
		// 	default:
		// 		return null;
		// }
	}

	private static buildParentBattlegroundsState(
		navigationState: NavigationState,
		dataState: MainWindowState,
		mainNav: MainWindowNavigationService,
	): NavigationState {
		if (!navigationState || !dataState) {
			// console.warn('Missing state for processing back navigation');
			return null;
		}
		switch (navigationState.navigationBattlegrounds.currentView) {
			case 'categories':
				return null;
			case 'category':
				return null;
			case 'list':
				// This is starting to be weird. It would probably be best to have an FSM,
				// and derive the name of the current navigation from the state we are in
				mainNav.text$$.next(null);
				return navigationState.update({
					navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
						menuDisplayType: 'menu',
						currentView: 'list',
					} as NavigationBattlegrounds),
				} as NavigationState);
			default:
				return null;
		}
	}

	private static buildParentCollectionState(
		navigationState: NavigationState,
		setsManager: SetsManagerService,
		mainNav: MainWindowNavigationService,
		nav: CollectionNavigationService,
	): NavigationState {
		switch (nav.currentView$$.getValue()) {
			case 'sets':
				// nav.selectedSetId$$.next(null);
				mainNav.text$$.next(null);
				mainNav.image$$.next(null);
				return null;
			case 'cards':
				// nav.currentView$$.next('sets');
				mainNav.text$$.next(null);
				mainNav.image$$.next(null);
				return null;
			case 'card-details':
				// We should already have initialized the sets by then
				const selectedSet = setsManager.sets$$
					.getValue()
					?.find((set) => set.getCard(nav.selectedCardId$$.getValue()) != null);
				// nav.currentView$$.next('cards');
				nav.selectedSetId$$.next(selectedSet?.id);
				mainNav.text$$.next(selectedSet?.name);
				return navigationState.update({
					navigationCollection: navigationState.navigationCollection.update({
						cardList: selectedSet?.allCards,
					} as NavigationCollection),
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
		mainNav: MainWindowNavigationService,
	): NavigationState {
		switch (navigationState.navigationReplays?.currentView) {
			case 'list':
				return null;
			case 'match-details':
				mainNav.text$$.next(null);
				return navigationState.update({
					navigationReplays: navigationState.navigationReplays.update({
						currentView: 'list',
					} as NavigationReplays),
				} as NavigationState);
			default:
				return null;
		}
	}
}
