import { BgsBoardInfo } from './bgs-board-info';

export interface BgsBattleInfo {
	readonly playerBoard: BgsBoardInfo;
	readonly opponentBoard: BgsBoardInfo;
}
