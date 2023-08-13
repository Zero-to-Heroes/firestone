export interface ClassInfo {
	readonly playerClass: string;
	readonly icon: string;
	readonly name: string;
	readonly totalMatches: number;
	readonly winrate: number;
	readonly wins?: number;
	readonly losses?: number;
	readonly top1?: number;
	readonly top4?: number;
}

export interface ModeOverview {
	readonly mode: 'constructed' | 'duels' | 'arena' | 'battlegrounds';
	readonly title: string;
	readonly icon: string;
	readonly wins?: number;
	readonly losses?: number;
	readonly top1?: number;
	readonly top4?: number;
	readonly gamesPlayed?: number;
	readonly winrate: number;
}
