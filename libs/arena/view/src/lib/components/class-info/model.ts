import { WinsDistribution } from '@firestone-hs/arena-stats';

export interface ArenaClassInfoTip {
	readonly tip: string;
	readonly author?: string;
	readonly patchNumber?: number;
	readonly date?: string;
}

export interface ArenaClassTier {
	readonly id: string;
	readonly label: string | null;
	readonly tooltip: string | null;
	readonly items: readonly ArenaClassInfo[];
}

export interface ArenaClassInfo {
	readonly playerClass: string;
	readonly dataPoints: number;
	readonly winrate: number;
	readonly placementDistribution: readonly WinsDistribution[];
	readonly tip?: ArenaClassInfoTip | null;
}
