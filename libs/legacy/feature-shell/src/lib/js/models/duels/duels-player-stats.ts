import { DeckStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsCombinedHeroStat } from '@firestone/duels/data-access';
import { GameStat } from '@firestone/stats/data-access';
import { DuelsGroupedDecks } from './duels-grouped-decks';
import { DuelsDeckSummary } from './duels-personal-deck';

export interface DuelsPlayerStats {
	readonly heroStats: readonly DuelsHeroPlayerStat[];
	readonly heroPowerStats: readonly DuelsHeroPlayerStat[];
	readonly signatureTreasureStats: readonly DuelsHeroPlayerStat[];
	readonly treasureStats: readonly DuelsHeroPlayerStat[];
	readonly deckStats: readonly DuelsGroupedDecks[];
	readonly personalDeckStats: readonly DuelsDeckSummary[];
}

export interface DuelsHeroPlayerStat extends DuelsCombinedHeroStat {
	readonly playerTotalMatches: number;
	readonly playerPopularity: number;
	readonly playerWinrate: number;
}

export interface DuelsTreasureStatForClass {
	readonly periodStart: string;
	readonly cardId: string;
	readonly playerClass: string;
	readonly globalTotalOffered: number;
	readonly globalTotalPicked: number;
	readonly globalOfferingRate: number;
	readonly globalPickRate: number;
	readonly globalTotalMatches: number;
	readonly globalTotalWins: number;
	readonly globalTotalLosses: number;
	readonly globalTotalTies: number;
	readonly globalWinrate: number;
}

export interface DuelsDeckStat extends DeckStat {
	readonly heroCardId: string;
	readonly dustCost: number;
	readonly steps: readonly (GameStat | DuelsRunInfo)[];
}
