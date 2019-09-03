import { RawRequirement } from './raw-requirement';

export interface RawAchievement {
	readonly id: string;
	readonly type: string;
	readonly name: string; // The name of the achievement in the achievements view
	readonly root?: boolean;
	readonly priority?: number;
	readonly displayName: string; // The header to display on the achievement notification
	/** @deprecated */ readonly text?: string;
	readonly emptyText?: string;
	readonly completedText?: string;
	readonly displayCardId: string;
	readonly displayCardType: string;
	readonly difficulty: string;
	readonly points: number;
	readonly requirements: readonly RawRequirement[];
	readonly resetEvents: readonly string[];
}
