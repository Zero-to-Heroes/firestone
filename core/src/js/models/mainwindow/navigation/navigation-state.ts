import { CurrentAppType } from '../current-app.type';
import { NavigationAchievements } from './navigation-achievements';
import { NavigationBattlegrounds } from './navigation-battlegrounds';
import { NavigationCollection } from './navigation-collection';
import { NavigationDecktracker } from './navigation-decktracker';
import { NavigationReplays } from './navigation-replays';

export class NavigationState {
	readonly isVisible: boolean = false;
	readonly currentApp: CurrentAppType = 'achievements';
	readonly navigationReplays: NavigationReplays = new NavigationReplays();
	readonly navigationCollection: NavigationCollection = new NavigationCollection();
	readonly navigationAchievements: NavigationAchievements = new NavigationAchievements();
	readonly navigationDecktracker: NavigationDecktracker = new NavigationDecktracker();
	readonly navigationBattlegrounds: NavigationBattlegrounds = new NavigationBattlegrounds();

	readonly backArrowEnabled = false;
	readonly nextArrowEnabled = false;
	readonly isNavigationState = false;
	readonly text: string = 'Categories'; // Init for Achievements, which is the default
	readonly image: string;

	public update(base: NavigationState): NavigationState {
		return Object.assign(new NavigationState(), this, base);
	}
}
