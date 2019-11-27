import { StatGameFormatType } from '../stats/stat-game-format.type';
import { StatGameModeType } from '../stats/stat-game-mode.type';
import { CoinPlayType } from './coin-play.type';
import { MatchResultType } from './match-result.type';

export class ReplayInfo {
	readonly additionalResult: string;
	readonly creationTimestamp: number;
	readonly playerDeckName: string;
	readonly playerSkin: string;
	readonly playerClass: string;
	readonly playerRank: string;
	readonly playerName: string;
	readonly opponentName: string;
	readonly opponentSkin: string;
	readonly opponentClass: string;
	readonly result: MatchResultType;
	readonly coinPlay: CoinPlayType;
	readonly reviewId: string;
	readonly gameMode: StatGameModeType;
	readonly gameFormat: StatGameFormatType;
}
