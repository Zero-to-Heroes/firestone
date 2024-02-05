import { Pick } from '@firestone-hs/arena-draft-pick';

export interface ArenaDeckDetails {
	readonly deckstring: string;
	readonly runId: string;
	readonly picks: readonly Pick[] | undefined;
}
