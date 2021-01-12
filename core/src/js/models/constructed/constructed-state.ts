import { AchievementsProgress } from '../achievement/achievement-progress';

export class ConstructedState {
	readonly currentTab = 'achievements';
	readonly initialAchievementsProgress: AchievementsProgress;
	readonly currentAchievementsProgress: AchievementsProgress;

	public update(base: ConstructedState): ConstructedState {
		return Object.assign(new ConstructedState(), this, base);
	}
}
