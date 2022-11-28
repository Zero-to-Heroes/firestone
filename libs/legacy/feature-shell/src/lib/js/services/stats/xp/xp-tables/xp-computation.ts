import { Season1 } from './season-1';
import { Season2 } from './season-2';
import { Season3 } from './season-3';
import { Season4 } from './season-4';
import { Season5 } from './season-5';
import { Season6 } from './season-6';
import { Season } from './_season';

export const xpSeason1 = new Season1();
export const xpSeason2 = new Season2();
export const xpSeason3 = new Season3();
export const xpSeason4 = new Season4();
export const xpSeason5 = new Season5();
export const xpSeason6 = new Season6();
const allSeasons: readonly Season[] = [xpSeason1, xpSeason2, xpSeason3, xpSeason4, xpSeason5, xpSeason6];

export const computeXpFromLevel = (fullLevel: string, timestamp: number): number => {
	if (!fullLevel.includes('-')) {
		return;
	}

	const [level, xpInLevel] = fullLevel.split('-').map((info) => parseInt(info));
	const season: Season = getSeason(timestamp);
	if (!season) {
		return 0;
	}

	const baseXp = season.getXpForLevel(level) ?? 0;
	return baseXp + xpInLevel;
};

export const getSeason = (timestamp: number): Season => {
	return allSeasons.find(
		(season) => season.startDate.getTime() <= timestamp && timestamp <= season.endDate.getTime(),
	);
};
