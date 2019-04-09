import { AchievementSet } from "../../../models/achievement-set";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";
import { VisualAchievement } from "../../../models/visual-achievement";

export abstract class SetProvider {
    readonly id: string;
    readonly displayName: string;
    readonly types: string[];

    constructor(id: string, displayName: string, types: string[]) {
        this.id = id;
        this.displayName = displayName;
        this.types = types;
    }

    public abstract provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet;
    protected abstract convertToVisual(achievement: Achievement, index: number, mergedAchievements: Achievement[]): IndexedVisualAchievement;
    protected abstract filterOptions();
    protected abstract isAchievementVisualRoot(achievement: Achievement): boolean;
    
    public supportsAchievement(allAchievements: Achievement[], achievementId: string): boolean {
        const type = allAchievements
                .find((achievement) => achievement.id == achievementId)
                .type
        return this.types.indexOf(type) !== -1;
    }

    protected visualAchievements(
            allAchievements: Achievement[], 
            completedAchievemnts?: CompletedAchievement[]): ReadonlyArray<VisualAchievement> {
		const mergedAchievements: Achievement[] = !completedAchievemnts
			? allAchievements
			: allAchievements
				.map((ref: Achievement) => {
					let completedAchievement = completedAchievemnts.filter(compl => compl.id == ref.id).pop();
					const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
					const replayInfo = completedAchievement ? completedAchievement.replayInfo : [];
					return new Achievement(
                        ref.id, 
                        ref.name, 
                        ref.text,
                        ref.type, 
                        ref.cardId, 
                        ref.cardType, 
                        ref.secondaryCardId,
                        ref.secondaryCardType,
                        ref.difficulty, 
                        numberOfCompletions, 
                        replayInfo);
				})
		const fullAchievements: VisualAchievement[] = mergedAchievements
            .filter(achievement => this.isAchievementVisualRoot(achievement))
			.map((achievement, index) => this.convertToVisual(achievement, index, mergedAchievements))
			.sort((a, b) => {
				const aVisibility = this.sortPriority(a.achievement);
				const bVisibility = this.sortPriority(b.achievement);
				return bVisibility - aVisibility || a.index - b.index;
			})
			.map((obj) => obj.achievement);
		return fullAchievements;
	}

    private sortPriority(achievement: VisualAchievement): number {
        const numberOfSteps = achievement.completionSteps.length;
        for (let i = numberOfSteps; i > 0; i--) {
            if (achievement.completionSteps[i - 1].numberOfCompletions > 0) {
                return i;
            }
        }
        return 0;
    }
}

export interface IndexedVisualAchievement {
	achievement: VisualAchievement,
	index: number;
}