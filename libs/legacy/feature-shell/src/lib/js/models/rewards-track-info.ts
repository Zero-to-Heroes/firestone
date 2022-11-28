import { RewardTrackType } from '@firestone-hs/reference-data';

export interface RewardsTrackInfos {
	readonly TrackEntries: readonly RewardsTrackInfo[];
}

export interface RewardsTrackInfo {
	readonly TrackType: RewardTrackType;
	readonly Level: number;
	readonly Xp: number;
	readonly XpNeeded: number;
	readonly XpBonusPercent;
}
