import { CardClass, GameType } from '@firestone-hs/reference-data';

export interface MemoryPlayerProfileInfo {
	readonly PlayerRecords: readonly MemoryPlayerRecord[];
	readonly PlayerClasses: readonly MemoryPlayerClass[];
}

export interface MemoryPlayerRecord {
	readonly RecordType: GameType;
	readonly Data: number;
	readonly Wins: number;
	readonly Losses: number;
	readonly Ties: number;
}

export interface MemoryPlayerClass {
	readonly TagClass: CardClass;
	readonly Level: number;
}
