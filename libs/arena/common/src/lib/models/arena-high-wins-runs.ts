import { ArenaRunInfo } from '@firestone-hs/arena-high-win-runs';

export interface ArenaGroupedRuns {
	readonly header: string;
	readonly runs: readonly ArenaRunInfo[];
}
