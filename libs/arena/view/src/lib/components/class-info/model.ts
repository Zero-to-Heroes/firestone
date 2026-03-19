import { WinsDistribution } from '@firestone-hs/arena-stats';
import { ArenaClassInfoTip } from '@firestone/arena/common';

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
