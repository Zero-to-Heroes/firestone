import { Map } from 'immutable';
import { HistoryItem } from './history/history-item';

export interface ReplayIndexMeta {
	readonly buildNumber: number;
	readonly formatType: number;
	readonly gameType: number;
	readonly scenarioID: number;
}

export interface ReplayIndex {
	readonly meta: ReplayIndexMeta | null;
	readonly turnChunks: readonly (readonly HistoryItem[])[];
	readonly entityCardId: Map<number, string>;
	readonly turnTimestamps: readonly number[];
	readonly totalDuration: number;
}
