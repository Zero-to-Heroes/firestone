import { CardPlayedByTurn } from '@firestone-hs/hs-replay-xml-parser/dist/lib/parsers/cards-played-by-turn-parser';
import { BgsHeroQuest, BgsHeroTrinket } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BnetRegion, GameType } from '@firestone-hs/reference-data';

/**
 * Everything the upload pipeline reads from a parsed Replay, as a plain
 * structured-cloneable object (no ElementTree), so the full replay-XML parse can run
 * in a worker thread and only this summary crosses back to the main thread (Plan H
 * phase 2, docs/electron-memory-investigation.md).
 *
 * Scalar field names intentionally match the Replay model so consumers can treat
 * `ReplayEssentials | Replay` uniformly.
 */
export interface ReplayEssentials {
	readonly mainPlayerId: number;
	readonly mainPlayerCardId: string;
	readonly mainPlayerName: string;
	readonly mainPlayerHeroPowerCardId: string;
	readonly opponentPlayerId: number;
	readonly opponentPlayerCardId: string;
	readonly opponentPlayerName: string;
	readonly opponentPlayerHeroPowerCardId: string;
	readonly region: BnetRegion;
	readonly gameType: GameType;
	readonly result: 'won' | 'lost' | 'tied';
	readonly additionalResult: string;
	readonly playCoin: 'play' | 'coin';
	readonly totalDurationSeconds: number;
	readonly totalDurationTurns: number;

	readonly hasBgsQuests: boolean;
	readonly bgsHeroQuests: readonly BgsHeroQuest[];
	readonly hasBgsAnomalies: boolean;
	readonly bgsAnomalies: readonly string[];
	readonly hasBgsTrinkets: boolean;
	readonly hasBgsTimewarped: boolean;
	readonly bgsHeroTrinkets: readonly BgsHeroTrinket[];
	readonly bgsHeroTrinketsOffered: readonly string[];

	// Output of CardsPlayedByTurnParser, already restricted to the two player ids
	readonly playerPlayedCardsByTurn: readonly CardPlayedByTurn[];
	readonly playerCastCardsByTurn: readonly CardPlayedByTurn[];
	readonly opponentPlayedCardsByTurn: readonly CardPlayedByTurn[];
	readonly opponentCastCardsByTurn: readonly CardPlayedByTurn[];
}
