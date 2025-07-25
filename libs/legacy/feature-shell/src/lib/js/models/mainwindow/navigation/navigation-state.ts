import { NonFunctionProperties } from '../../../services/utils';
import { NavigationAchievements } from './navigation-achievements';
import { NavigationCollection } from './navigation-collection';
import { NavigationDecktracker } from './navigation-decktracker';
import { NavigationMercenaries } from './navigation-mercenaries';
import { NavigationReplays } from './navigation-replays';
import { NavigationStats } from './navigation-stats';
import { NavigationStreams } from './navigation-streams';

export class NavigationState {
	readonly navigationReplays: NavigationReplays = new NavigationReplays();
	readonly navigationCollection: NavigationCollection = new NavigationCollection();
	readonly navigationAchievements: NavigationAchievements = new NavigationAchievements();
	readonly navigationDecktracker: NavigationDecktracker = new NavigationDecktracker();
	readonly navigationMercenaries: NavigationMercenaries = new NavigationMercenaries();
	readonly navigationStats: NavigationStats = new NavigationStats();
	readonly navigationStreams: NavigationStreams = new NavigationStreams();

	readonly isNavigationState = false;

	public update(base: Partial<NonFunctionProperties<NavigationState>>): NavigationState {
		return Object.assign(new NavigationState(), this, base);
	}
}
