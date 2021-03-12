import { BoostersInfo } from './boosters-info';

export interface MemoryUpdate {
	readonly DisplayingAchievementToast: boolean;
	readonly CurrentScene: string;
	readonly Boosters: BoostersInfo;
}
