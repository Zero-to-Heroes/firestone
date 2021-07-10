import { ArenaCategory } from '../mainwindow/arena/arena-category';
import { PatchInfo } from '../patches';
import { ArenaClassFilterType } from './arena-class-filter.type';
import { ArenaTimeFilterType } from './arena-time-filter.type';

export class ArenaState {
	readonly loading: boolean = true;
	readonly categories: readonly ArenaCategory[] = [];
	readonly currentArenaMetaPatch: PatchInfo;

	readonly activeHeroFilter: ArenaClassFilterType;
	readonly activeTimeFilter: ArenaTimeFilterType;

	public static create(base: ArenaState): ArenaState {
		return Object.assign(new ArenaState(), base);
	}

	public update(base: ArenaState): ArenaState {
		return Object.assign(new ArenaState(), this, base);
	}
}
