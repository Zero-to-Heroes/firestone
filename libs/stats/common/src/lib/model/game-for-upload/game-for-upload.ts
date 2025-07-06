import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { Race } from '@firestone-hs/reference-data';
import { MatchResultType, StatGameFormatType, StatGameModeType } from '@firestone/stats/data-access';

export interface XpForGameInfo {
	readonly currentXp: number;
	readonly currentLevel: number;
	readonly realXpGained: number;
	readonly xpGainedWithoutBonus: number;
	readonly bonusXp: number;
	readonly xpNeeded: number;
}

export class GameForUpload {
	uniqueId: string;
	reviewId: string;
	runId: string;
	title: string;

	spectating: boolean;

	gameMode: StatGameModeType;
	gameFormat: StatGameFormatType;
	buildNumber: number;
	scenarioId: number;
	seasonId: number | null;
	playerRank: string;
	newPlayerRank: string;
	additionalResult: string;
	opponentRank: string;
	result: MatchResultType;
	// arenaInfo: any;
	durationTimeSeconds: number;
	durationTurns: number;
	ended: boolean;

	forceOpponentName: string;

	xpForGame: XpForGameInfo;

	player: Player = new Player();
	opponent: Player = new Player();

	deckstring: string;
	deckName: string;
	replay: Replay;

	availableTribes: readonly Race[];
	bannedTribes: readonly Race[];
	hasBgsPrizes: boolean;
	hasBgsSpells: boolean;
	bgBattleOdds: readonly { turn: number; wonPercent: number }[];
	bgsAnomalies: readonly string[];
	bgGame?: any /*BgsGame*/;
	compArchetype: string | null;

	/** @deprecated */
	mercsBountyId: number;

	lotteryPoints?: number;

	// We don't send this over the network, but it avoids compression / decompression when
	// using it locally in the GS
	// uncompressedXmlReplay: string;

	// TODO: we can probably remove that ID, it was used by Manastorm but doesn't make
	// sense for Firestone anymore
	static createEmptyGame(id: string): GameForUpload {
		const game = new GameForUpload();
		game.reviewId = id;
		return game;
	}
}

export class Player {
	name: string;
	class: string;
	hero: string;
}
