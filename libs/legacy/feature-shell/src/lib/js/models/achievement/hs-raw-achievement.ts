export interface HsRawAchievement {
	readonly id: number;
	readonly sectionId: number;
	readonly sortOrder: number;
	readonly enabled: number;
	readonly name: string;
	readonly description: string;
	readonly quota: number;
	readonly points: number;
	readonly rewardTrackXp: number;
	readonly rewardListId: number;
	readonly nextTierId: number;
}
