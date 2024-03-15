import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { DraftDeckStats, Pick } from '@firestone-hs/arena-draft-pick';
import { GameStat } from '@firestone/stats/data-access';

export interface ArenaDeckDetails {
	readonly deckstring: string;
	readonly runId: string;
	readonly overview: ArenaDeckOverview;
	readonly picks: readonly Pick[] | undefined;
}
export interface ArenaDeckOverview {
	readonly wins: number;
	readonly losses: number;
	readonly playerCardId: string;
	readonly playerClassImage: string | null;
	readonly steps: readonly GameStat[];
	readonly rewards: readonly ArenaRewardInfo[];
	readonly draftStat: DraftDeckStats;
}
