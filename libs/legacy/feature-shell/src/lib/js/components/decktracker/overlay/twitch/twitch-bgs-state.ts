import { Race } from '@firestone-hs/reference-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import {
	BgsBattleHistory,
	BgsComposition,
	BgsTavernUpgrade,
	BgsTriple,
	QuestReward,
} from '@firestone/battlegrounds/common';

export interface TwitchBgsState {
	readonly leaderboard: readonly TwitchBgsPlayer[];
	readonly currentTurn: number;
	readonly gameEnded: boolean;
	readonly inGame: boolean;
	readonly currentBattle?: TwitchBgsCurrentBattle;
	readonly availableRaces: readonly Race[];
	readonly phase: 'recruit' | 'combat';
	readonly lesserTrinket: string | undefined;
	readonly greaterTrinket: string | undefined;
	readonly config: TwitchBgsStateConfig;
}

export interface TwitchBgsStateConfig {
	readonly hasBuddies: boolean;
	readonly hasQuests: boolean;
	readonly hasPrizes: boolean;
	readonly hasSpells: boolean;
	readonly anomalies: readonly string[];
}

export interface TwitchBgsCurrentBattle {
	battleInfo: SimulationResult;
	status: 'empty' | 'waiting-for-result' | 'done';
}

export interface TwitchBgsPlayer {
	readonly cardId: string;
	readonly heroPowerCardId: string;
	readonly name: string;
	readonly isMainPlayer: boolean;
	readonly tavernUpgradeHistory: readonly BgsTavernUpgrade[];
	readonly tripleHistory: readonly BgsTriple[];
	readonly lastBoard: TwitchBgsBoard;
	readonly initialHealth: number;
	readonly damageTaken: number;
	readonly leaderboardPlace: number;
	readonly currentWinStreak: number;
	readonly lastKnownComposition: BgsComposition;
	readonly lastKnownBattleHistory: BgsBattleHistory;
	readonly questRewards: readonly QuestReward[];
	readonly buddyTurns: readonly number[];
	readonly lesserTrinket: string;
	readonly greaterTrinket: string;
}

export interface TwitchBgsBoard {
	readonly turn: number;
	readonly board: readonly TwitchBgsBoardEntity[];
}

export interface TwitchBgsBoardEntity {
	readonly id: number;
	readonly cardID: string;
	readonly tags: { [tagName: string]: number };
}
