import { AchievementSet } from "../../../models/achievement-set";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";

export abstract class SetProvider {
    readonly id: string;
    readonly displayName: string;
    readonly types: string[];

    constructor(id: string, displayName: string, types: string[]) {
        this.id = id;
        this.displayName = displayName;
        this.types = types;
    }

    abstract provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet;
    
    abstract supportsAchievement(allAchievements: Achievement[], achievementId: string): boolean;
}