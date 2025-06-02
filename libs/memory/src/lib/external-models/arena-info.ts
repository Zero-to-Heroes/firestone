import { GameType } from '@firestone-hs/reference-data';

export interface ArenaInfo {
	readonly gameType: GameType;
	readonly wins: number;
	readonly losses: number;
	readonly heroCardId: string;
	readonly runId: string;
}
