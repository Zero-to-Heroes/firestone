import { Board } from '@firestone-hs/reference-data';
import { PlayerInfo } from './player-info';

export interface MatchInfo {
	readonly localPlayer: PlayerInfo | null;
	readonly opponent: PlayerInfo | null;
	readonly boardId: Board;
	readonly anomalies: readonly string[];
}
