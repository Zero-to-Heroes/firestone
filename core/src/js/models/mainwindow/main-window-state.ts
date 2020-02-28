import { CurrentUser } from '../overwolf/profile/current-user';
import { AchievementsState } from './achievements-state';
import { BinderState } from './binder-state';
import { CurrentAppType } from './current-app.type';
import { DecktrackerState } from './decktracker/decktracker-state';
import { Navigation } from './navigation';
import { NonNavigationState } from './non-navigation-state';
import { ReplaysState } from './replays/replays-state';
import { SocialShareUserInfo } from './social-share-user-info';
import { GlobalStats } from './stats/global/global-stats';
import { StatsState } from './stats/stats-state';

export class MainWindowState {
	readonly isVisible: boolean = false;
	readonly currentUser: CurrentUser = null;
	readonly currentApp: CurrentAppType = 'achievements';
	readonly replays: ReplaysState = new ReplaysState();
	readonly binder: BinderState = new BinderState();
	readonly achievements: AchievementsState = new AchievementsState();
	readonly decktracker: DecktrackerState = new DecktrackerState();
	readonly socialShareUserInfo: SocialShareUserInfo = new SocialShareUserInfo();
	readonly stats: StatsState = new StatsState();
	readonly globalStats: GlobalStats = new GlobalStats();
	readonly navigation: Navigation = new Navigation();
	// Store all elements that should not be modified when navigating back and forth
	// IMPORTANT: I think ultimately it should probably done this other way around - the
	// main states contain permanent info (like the achievments unlocked, which don't
	// depend on the current navigation), and we have a "navigation state" that
	// only contains the info that should be updated when navigating (like what page
	// is currently being displayed)
	readonly nonNavigationState: NonNavigationState = new NonNavigationState();
}
