import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { NavigationBackEvent } from '../../events/navigation/navigation-back-event';
import { StateHistory } from '../../state-history';
import { Processor } from '../processor';

export class NavigationBackProcessor implements Processor {
	public async process(
		event: NavigationBackEvent,
		currentState: MainWindowState,
		history: readonly StateHistory[],
	): Promise<MainWindowState> {
		// console.log('returning state', NavigationBackProcessor.buildParentState(currentState), currentState);
		// return NavigationBackProcessor.buildParentState(currentState);
		let targetIndex = NavigationBackProcessor.getTargetIndex(currentState, history);
		if (targetIndex === -1) {
			console.log('building parent state');
			return NavigationBackProcessor.buildParentState(currentState) || currentState;
		}
		return history[targetIndex].state;
	}

	public static getTargetIndex(currentState: MainWindowState, history: readonly StateHistory[]): number {
		let currentIndex = history.map(history => history.state).indexOf(currentState);
		while (currentIndex >= 0 && !history[currentIndex].navigation) {
			currentIndex--;
		}
		// We go back until we find an item that is a navigation state
		let targetIndex = -1;
		for (let i = currentIndex - 1; i >= 0; i--) {
			if (history[i].navigation) {
				targetIndex = i;
				break;
			}
		}
		return targetIndex;
	}

	// Since the navigation itself is not modeled inside the state, I don't have any choice
	// but to add big if/else statements here
	public static buildParentState(currentState: MainWindowState): MainWindowState {
		switch (currentState.currentApp) {
			case 'achievements':
				return NavigationBackProcessor.buildParentAchievementsState(currentState);
			case 'collection':
				return NavigationBackProcessor.buildParentCollectionState(currentState);
			case 'decktracker':
				return NavigationBackProcessor.buildParentDecktrackerState(currentState);
			case 'replays':
				return NavigationBackProcessor.buildParentReplaysState(currentState);
			default:
				return currentState;
		}
	}

	private static buildParentAchievementsState(currentState: MainWindowState): MainWindowState {
		switch (currentState.achievements.currentView) {
			case 'categories':
				return null;
			case 'category':
				return Object.assign(new MainWindowState(), currentState, {
					achievements: Object.assign(new AchievementsState(), currentState.achievements, {
						currentView: 'categories',
					} as AchievementsState),
					navigation: Object.assign(new Navigation(), currentState.navigation, {
						text: 'Categories',
					} as Navigation),
				} as MainWindowState);
			case 'list':
				const category = currentState.achievements.globalCategories.find(
					cat => cat.id === currentState.achievements.selectedGlobalCategoryId,
				);
				if (category.achievementSets.length === 1) {
					return Object.assign(new MainWindowState(), currentState, {
						achievements: Object.assign(new AchievementsState(), currentState.achievements, {
							currentView: 'categories',
						} as AchievementsState),
						navigation: Object.assign(new Navigation(), currentState.navigation, {
							text: 'Categories',
						} as Navigation),
					} as MainWindowState);
				}
				return Object.assign(new MainWindowState(), currentState, {
					achievements: Object.assign(new AchievementsState(), currentState.achievements, {
						currentView: 'category',
					} as AchievementsState),
					// This is starting to be weird. It would probably be best to have an FSM,
					// and derive the name of the current navigation from the state we are in
					navigation: Object.assign(new Navigation(), currentState.navigation, {
						text: currentState.achievements.globalCategories.find(
							cat => cat.id === currentState.achievements.selectedGlobalCategoryId,
						).name,
					} as Navigation),
				} as MainWindowState);
			default:
				return null;
		}
	}

	private static buildParentCollectionState(currentState: MainWindowState): MainWindowState {
		switch (currentState.binder.currentView) {
			case 'sets':
				return null;
			case 'cards':
				return Object.assign(new MainWindowState(), currentState, {
					binder: Object.assign(new BinderState(), currentState.binder, {
						currentView: 'sets',
					} as BinderState),
					navigation: Object.assign(new Navigation(), currentState.navigation, {
						text: null,
					} as Navigation),
				} as MainWindowState);
			case 'card-details':
				const selectedSet = currentState.binder.allSets.find(
					set => set.allCards.find(card => card.id === currentState.binder.selectedCard.id) != null,
				);
				console.log('selected set', selectedSet, currentState);
				return Object.assign(new MainWindowState(), currentState, {
					binder: Object.assign(new BinderState(), currentState.binder, {
						currentView: 'cards',
						selectedSet: selectedSet,
						cardList: selectedSet.allCards,
					} as BinderState),
					navigation: Object.assign(new Navigation(), currentState.navigation, {
						text: currentState.binder.selectedSet.name,
					} as Navigation),
				} as MainWindowState);
			default:
				return null;
		}
	}

	private static buildParentDecktrackerState(currentState: MainWindowState): MainWindowState {
		return null;
	}

	private static buildParentReplaysState(currentState: MainWindowState): MainWindowState {
		switch (currentState.replays.currentView) {
			case 'list':
				return null;
			case 'match-details':
				return Object.assign(new MainWindowState(), currentState, {
					replays: Object.assign(new ReplaysState(), currentState.replays, {
						currentView: 'list',
					} as ReplaysState),
				} as MainWindowState);
			default:
				return null;
		}
	}
}
