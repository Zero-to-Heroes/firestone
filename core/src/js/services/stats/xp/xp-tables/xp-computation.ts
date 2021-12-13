import { Season1 } from './season-1';
import { Season2 } from './season-2';
import { Season3 } from './season-3';
import { Season4 } from './season-4';
import { Season } from './_season';

export const xpSeason1 = new Season1();
export const xpSeason2 = new Season2();
export const xpSeason3 = new Season3();
export const xpSeason4 = new Season4();
const allSeasons: readonly Season[] = [xpSeason1, xpSeason2, xpSeason3, xpSeason4];

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
