import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { DuelsState } from '../duels/duels-state';
import { CurrentUser } from '../overwolf/profile/current-user';
import { AchievementsState } from './achievements-state';
import { BattlegroundsAppState } from './battlegrounds/battlegrounds-app-state';
import { BinderState } from './binder-state';
import { DecktrackerState } from './decktracker/decktracker-state';
import { ReplaysState } from './replays/replays-state';
import { SocialShareUserInfo } from './social-share-user-info';
import { GameStat } from './stats/game-stat';
import { StatsState } from './stats/stats-state';

export class MainWindowState {
	readonly currentUser: CurrentUser = null;
	readonly showFtue: boolean = false;
	readonly replays: ReplaysState = new ReplaysState();
	readonly binder: BinderState = new BinderState();
	readonly achievements: AchievementsState = new AchievementsState();
	readonly decktracker: DecktrackerState = new DecktrackerState();
	readonly battlegrounds: BattlegroundsAppState = new BattlegroundsAppState();
	readonly duels: DuelsState = new DuelsState();
	readonly socialShareUserInfo: SocialShareUserInfo = new SocialShareUserInfo();
	readonly stats: StatsState = new StatsState();
	readonly globalStats: GlobalStats = new GlobalStats();
	readonly showAds: boolean = true;

	public update(base: MainWindowState): MainWindowState {
		return Object.assign(new MainWindowState(), this, base);
	}

	public findReplay(reviewId: string): GameStat {
		const result = this.replays.allReplays.find((replay) => replay.reviewId === reviewId);
		if (result) {
			return result;
		}

		return this.battlegrounds.findReplay(reviewId);
	}
}
