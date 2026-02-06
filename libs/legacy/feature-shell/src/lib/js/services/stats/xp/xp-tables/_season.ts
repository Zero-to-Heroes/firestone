import { StatsXpGraphSeasonFilterType } from '@firestone/mainwindow/common';
import { Map } from 'immutable';

export interface Season {
	readonly id: StatsXpGraphSeasonFilterType;
	readonly startDate: Date;
	readonly xpPerLevel: Map<number, number>;

	getXpForLevel(level: number): number;
}
