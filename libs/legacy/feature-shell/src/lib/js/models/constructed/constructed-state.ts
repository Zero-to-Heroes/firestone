import { AchievementsProgress } from '../achievement/achievement-progress';
import { ConstructedTab } from './constructed-tab.type';

export class ConstructedState {
	readonly currentTab: ConstructedTab = 'achievements';
	readonly initialAchievementsProgress: AchievementsProgress;
	readonly currentAchievementsProgress: AchievementsProgress;

	public update(base: ConstructedState): ConstructedState {
		return Object.assign(new ConstructedState(), this, base);
	}
}
