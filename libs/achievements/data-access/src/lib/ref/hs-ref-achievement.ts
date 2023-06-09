export interface HsRefAchiementsData {
	readonly achievements: readonly HsRefAchievement[];
	readonly categories: readonly HsRefCategory[];
}

export interface HsRefAchievement {
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

export interface HsRefCategory {
	readonly id: number;
	readonly name: string; // Default name
	readonly locales: readonly HsRefCategoryLocale[];

}

export interface HsRefCategoryLocale {
	readonly name: string;
	readonly locale: string;
	readonly localeId: number;
}