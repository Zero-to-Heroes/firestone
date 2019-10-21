import { CoinPlayType } from './coin-play.type';
import { MatchResultType } from './match-result.type';

export class DeckReplayInfo {
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
}
