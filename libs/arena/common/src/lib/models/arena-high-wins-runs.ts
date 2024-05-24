import { ArenaRunInfo, HighWinRunsInfo } from '@firestone-hs/arena-high-win-runs';

export interface ArenaGroupedRuns {
	readonly header: string;
	readonly runs: readonly ArenaRunInfo[];
}

export interface ExtendedHighWinRunsInfo extends HighWinRunsInfo {
	readonly runs: ExtendedArenaRunInfo[];
}

export interface ExtendedArenaRunInfo extends ArenaRunInfo {
	readonly notabledCards: readonly InternalNotableCard[];
}

export interface InternalNotableCard {
	image: string;
	cardId: string;
}
