export class Achievement {
	readonly hsAchievementId: number;
	readonly hsSectionId: number;
	readonly hsRewardTrackXp: number;
	readonly id: string;
	readonly type: string;
	readonly name: string;
	readonly icon: string;
	readonly root: boolean;
	readonly canBeCompletedOnlyOnce: boolean;
	readonly priority: number; // Used to sort the achievements
	readonly displayName: string;
	readonly text: string;
	readonly emptyText: string;
	readonly completedText: string;
	readonly displayCardId: string;
	readonly displayCardType: string;
	readonly difficulty: string;
	readonly maxNumberOfRecords: number;
	readonly points: number;
	readonly numberOfCompletions: number = 0;
	readonly linkedAchievementIds: readonly string[] = [];
	// For HS exclusive achievements?
	readonly progress?: number;

	public static create(base: Achievement): Achievement {
		return Object.assign(new Achievement(), base);
	}

	public update(value: Achievement): Achievement {
		return Object.assign(new Achievement(), this, value);
	}
}
