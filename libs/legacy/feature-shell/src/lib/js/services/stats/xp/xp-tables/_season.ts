import { StatsXpGraphSeasonFilterType } from '@legacy-import/src/lib/js/models/mainwindow/stats/stats-xp-graph-season-filter.type';
import { Map } from 'immutable';

export interface Season {
	readonly id: StatsXpGraphSeasonFilterType;
	readonly startDate: Date;
	readonly xpPerLevel: Map<number, number>;

	getXpForLevel(level: number): number;
}
