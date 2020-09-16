import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';

export interface BgsPostMatchStatsForReview {
	readonly reviewId: string;
	readonly stats: IBgsPostMatchStats;
}
