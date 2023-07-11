import { RawAchievement } from './achievement/raw-achievement';

export interface Achievement extends RawAchievement {
	readonly numberOfCompletions: number;
	// For HS exclusive achievements
	readonly progress?: number;
}
