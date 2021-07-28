import { Map } from 'immutable';

export interface Season {
	readonly startDate: Date;
	readonly endDate: Date;
	readonly xpPerLevel: Map<number, number>;

	getXpForLevel(level: number): number;
}
