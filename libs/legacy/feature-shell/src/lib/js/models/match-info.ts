import { Board } from '@firestone-hs/reference-data';
import { PlayerInfo } from './player-info';

export interface MatchInfo {
	localPlayer: PlayerInfo;
	opponent: PlayerInfo;
	boardId: Board;
}
