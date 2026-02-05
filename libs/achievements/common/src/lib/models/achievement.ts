import { RawAchievement } from './raw-achievement';

export interface Achievement extends RawAchievement {
	readonly numberOfCompletions: number;
	// For HS exclusive achievements
	readonly progress?: number;
}
