import { Board } from '@firestone-hs/reference-data';
import { PlayerInfo } from './player-info';

export interface MatchInfo {
	readonly localPlayer: PlayerInfo;
	readonly opponent: PlayerInfo;
	readonly boardId: Board;
	readonly anomalies: readonly string[];
}
