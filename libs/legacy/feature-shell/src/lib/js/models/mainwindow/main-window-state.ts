import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { SceneMode } from '@firestone-hs/reference-data';
import { AppInjector } from '../../services/app-injector';
import { LazyDataInitService } from '../../services/lazy-data-init.service';
import { NonFunctionProperties } from '../../services/utils';
import { ArenaState } from '../arena/arena-state';
import { DuelsState } from '../duels/duels-state';
import { MercenariesState } from '../mercenaries/mercenaries-state';
import { PatchesConfig } from '../patches';
import { AchievementsState } from './achievements-state';
import { BattlegroundsAppState } from './battlegrounds/battlegrounds-app-state';
import { BinderState } from './binder-state';
import { DecktrackerState } from './decktracker/decktracker-state';
import { QuestsState } from './quests/quests-state';
import { ReplaysState } from './replays/replays-state';
import { SocialShareUserInfo } from './social-share-user-info';
import { GameStat } from './stats/game-stat';
import { StatsState } from './stats/stats-state';
import { StreamsState } from './streams/streams-state';

export class MainWindowState {
	readonly currentScene: SceneMode = null;
	readonly lastNonGamePlayScene: SceneMode = null;
	readonly currentUser: overwolf.profile.GetCurrentUserResult = null;
	readonly showFtue: boolean = false;
	readonly replays: ReplaysState = new ReplaysState();
	readonly binder: BinderState = new BinderState();
	readonly achievements: AchievementsState = new AchievementsState();
	readonly decktracker: DecktrackerState = new DecktrackerState();
	readonly battlegrounds: BattlegroundsAppState = new BattlegroundsAppState();
	readonly duels: DuelsState = new DuelsState();
	readonly arena: ArenaState = new ArenaState();
	readonly mercenaries: MercenariesState = new MercenariesState();
	readonly socialShareUserInfo: SocialShareUserInfo = new SocialShareUserInfo();
	readonly stats: StatsState = new StatsState();
	readonly quests: QuestsState = new QuestsState();
	readonly streams: StreamsState = new StreamsState();
	readonly patchConfig: PatchesConfig;
	readonly showAds: boolean = true;

	// See decktracker-state.ts for more info
	readonly globalStats: GlobalStats = undefined;

	public static create(base: Partial<NonFunctionProperties<MainWindowState>>): MainWindowState {
		return Object.assign(new MainWindowState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MainWindowState>>): MainWindowState {
		return Object.assign(new MainWindowState(), this, base);
	}

	public findReplay(reviewId: string): GameStat {
		const result = this.stats.gameStats?.stats.find((replay) => replay.reviewId === reviewId);
		if (result) {
			return result;
		}

		return this.battlegrounds.findReplay(reviewId);
	}

	public getGlobalStats(): GlobalStats {
		if (this.globalStats === undefined) {
			console.log('globalStats not initialized yet');
			(this.globalStats as GlobalStats) = null;
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('user-global-stats');
		}
		return this.globalStats;
	}
}
