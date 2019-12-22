import { Achievement } from '../../../models/achievement';
import { AchievementSet } from '../../../models/achievement-set';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { VisualAchievement } from '../../../models/visual-achievement';

export abstract class SetProvider {
	readonly id: string;
	readonly displayName: string;
	readonly types: string[];

	constructor(id: string, displayName: string, types: string[]) {
		this.id = id;
		this.displayName = displayName;
		this.types = types;
	}

	public abstract provide(
		allAchievements: readonly Achievement[],
		completedAchievemnts?: CompletedAchievement[],
	): AchievementSet;
	protected abstract convertToVisual(
		achievement: Achievement,
		index: number,
		mergedAchievements: Achievement[],
	): IndexedVisualAchievement;
	protected abstract filterOptions();
	protected abstract isAchievementVisualRoot(achievement: Achievement): boolean;

	protected visualAchievements(
		allAchievements: Achievement[],
		completedAchievemnts?: CompletedAchievement[],
	): readonly VisualAchievement[] {
		const mergedAchievements: Achievement[] = !completedAchievemnts
			? allAchievements
			: allAchievements.map((ref: Achievement) => {
					const completedAchievement = completedAchievemnts.filter(compl => compl.id === ref.id).pop();
					const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
					const replayInfo = completedAchievement ? completedAchievement.replayInfo : [];
					return Object.assign(new Achievement(), ref, {
						numberOfCompletions: numberOfCompletions,
						replayInfo: replayInfo,
					} as Achievement);
			  });
		const fullAchievements: VisualAchievement[] = mergedAchievements
			.filter(achievement => this.supportsAchievement(mergedAchievements, achievement.id))
			.filter(achievement => this.isAchievementVisualRoot(achievement))
			.map((achievement, index) => this.convertToVisual(achievement, index, mergedAchievements))
			.map(obj => obj.achievement);
		return fullAchievements;
	}

	private supportsAchievement(allAchievements: Achievement[], achievementId: string): boolean {
		const type = allAchievements.find(achievement => achievement.id === achievementId).type;
		return this.types.indexOf(type) !== -1;
	}
}

export interface IndexedVisualAchievement {
	achievement: VisualAchievement;
	index: number;
}
