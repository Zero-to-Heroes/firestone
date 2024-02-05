import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { Pick } from '@firestone-hs/arena-draft-pick';

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
	readonly rewards: readonly ArenaRewardInfo[];
}
