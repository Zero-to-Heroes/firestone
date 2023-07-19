import { CardClass } from '@firestone-hs/reference-data';

export interface ProfileClassStat {
	readonly playerClass: CardClass;
	readonly wins: number;
	readonly losses: number;
	readonly ties: number;
	readonly gameMode: 'duels' | 'arena' | 'constructed';
}
