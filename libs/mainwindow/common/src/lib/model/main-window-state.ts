import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ArenaState } from '@firestone/arena/common';
import { MercenariesState } from '@firestone/mercenaries/common';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { AchievementsState } from './achievements-state';
import { BattlegroundsAppState } from './battlegrounds/battlegrounds-app-state';
import { BinderState } from './binder-state';
import { DecktrackerState } from './decktracker/decktracker-state';
import { StatsState } from './stats/stats-state';
import { StreamsState } from './streams/streams-state';

export class MainWindowState {
	readonly showFtue: boolean = false;
	readonly binder: BinderState = new BinderState();
	readonly achievements: AchievementsState = new AchievementsState();
	readonly decktracker: DecktrackerState = new DecktrackerState();
	readonly battlegrounds: BattlegroundsAppState = new BattlegroundsAppState();
	readonly arena: ArenaState = new ArenaState();
	readonly mercenaries: MercenariesState = new MercenariesState();
	readonly stats: StatsState = new StatsState();
	readonly streams: StreamsState = new StreamsState();
	readonly globalStats: GlobalStats | undefined = undefined;

	readonly initComplete: boolean = false;

	public static create(base: Partial<NonFunctionProperties<MainWindowState>>): MainWindowState {
		return Object.assign(new MainWindowState(), base);
	}

	public update(base: Partial<NonFunctionProperties<MainWindowState>>): MainWindowState {
		return Object.assign(new MainWindowState(), this, base);
	}
}
