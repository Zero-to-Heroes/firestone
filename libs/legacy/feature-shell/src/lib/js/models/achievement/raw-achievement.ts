import { RawRequirement } from './raw-requirement';

export interface RawAchievement {
	readonly hsAchievementId: number;
	readonly hsSectionId: number;
	readonly hsRewardTrackXp: number;
	readonly id: string;
	readonly type: string;
	// The name of the achievement in the achievements view
	readonly name: string;
	// The icon to display in the completion steps
	readonly icon: string;
	readonly root?: boolean;
	readonly canBeCompletedOnlyOnce?: boolean;
	readonly priority?: number;
	readonly displayName: string; // The header to display on the achievement notification
	readonly text?: string;
	readonly emptyText?: string;
	readonly completedText?: string;
	readonly displayCardId: string;
	readonly displayCardType: string;
	readonly difficulty: string;
	readonly maxNumberOfRecords: number;
	readonly points: number;
	readonly quota: number;
	readonly requirements: readonly RawRequirement[];
	readonly resetEvents: readonly string[];
	readonly linkedAchievementIds?: readonly string[];
}
