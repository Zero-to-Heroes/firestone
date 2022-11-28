import { Race } from '@firestone-hs/reference-data';

export interface BattlegroundsInfo {
	readonly Rating: number;
	readonly NewRating?: number;
	readonly Game: MemoryBgGame;
}

export interface MemoryBgGame {
	readonly Players: MemoryBgPlayer[];
	readonly AvailableRaces: readonly number[];
}

export interface MemoryBgPlayer {
	readonly Id: number;
	readonly EntityId: number;
	readonly CardId: string;
	readonly Name: string;
	readonly MaxHealth: number;
	readonly Damage: number;
	readonly LeaderboardPosition: number;
	readonly TriplesCount: number;
	readonly TechLevel: number;
	readonly WinStreak: number;
	readonly BoardCompositionRace: Race;
	readonly BoardCompositionCount: number;
	readonly Battles: readonly MemoryBgBattle[];
}

export interface MemoryBgBattle {
	readonly OwnerCardId: string;
	readonly OpponentCardId: string;
	readonly Damage: number;
	readonly IsDefeated: boolean;
}
