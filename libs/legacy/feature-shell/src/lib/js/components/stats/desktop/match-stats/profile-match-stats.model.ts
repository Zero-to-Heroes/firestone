import { CardClass } from '@firestone-hs/reference-data';

export interface ClassInfo {
	readonly playerClass: CardClass;
	readonly icon: string;
	readonly name: string;
	readonly totalMatches: number;
	readonly winrate: number;
	readonly wins: number;
	readonly losses: number;
}

export interface ModeOverview {
	readonly mode: 'constructed' | 'duels' | 'arena';
	readonly title: string;
	readonly icon: string;
	readonly wins: number;
	readonly losses: number;
	readonly winrate: number;
}
