import { CurrentUser } from '../overwolf/profile/current-user';
import { AchievementsState } from './achievements-state';
import { BinderState } from './binder-state';
import { CurrentAppType } from './current-app.type';
import { Navigation } from './navigation';
import { SocialShareUserInfo } from './social-share-user-info';
import { MatchStatsState } from './stats/match-stats-state';
import { StatsState } from './stats/stats-state';

export class MainWindowState {
	readonly isVisible: boolean = false;
	readonly currentUser: CurrentUser = null;
	readonly currentApp: CurrentAppType = 'collection';
	readonly binder: BinderState = new BinderState();
	readonly achievements: AchievementsState = new AchievementsState();
	readonly socialShareUserInfo: SocialShareUserInfo = new SocialShareUserInfo();
	readonly stats: StatsState = new StatsState();
	readonly matchStats: MatchStatsState = new MatchStatsState();
	readonly navigation: Navigation = new Navigation();
}
