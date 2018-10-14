import { AchievementSet } from "../../../models/achievement-set";
import { SetProvider } from "./set-provider";
import { VisualAchievement } from "../../../models/visual-achievement";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";

export class DungeonRunBossSetProvider extends SetProvider {

    constructor() {
        super('dungeon_run_boss', 'Dungeon Run Boss', ['dungeon_run_boss_encounter', 'dungeon_run_boss_victory']);
    }

    // Used only for display
    public provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet {
        const mergedAchievements: Achievement[] = !completedAchievemnts
            ? allAchievements
            : allAchievements
                .map((ref: Achievement) => {
                    let completedAchievement = completedAchievemnts.filter(compl => compl.id == ref.id).pop();
                    const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
                    return new Achievement(ref.id, ref.name, ref.type, ref.cardId, numberOfCompletions);
                });
        // console.log('merging achievements', completedAchievemnts, allAchievements, mergedAchievements);
        const fullAchievements: VisualAchievement[] = mergedAchievements
            .filter(achievement => achievement.type == 'dungeon_run_boss_encounter')
            .map((achievement) => {
                const encountedId = 'dungeon_run_boss_encounter_' + achievement.cardId;
                const victoryId = 'dungeon_run_boss_victory_' + achievement.cardId;
                const encounterAchievement = mergedAchievements.filter((ach) => ach.id == encountedId)[0];
                const victoryAchievement = mergedAchievements.filter((ach) => ach.id == victoryId)[0];
                return new VisualAchievement(
                    achievement.id,
                    achievement.name, 
                    this.id, 
                    achievement.cardId,
                    [ encountedId, victoryId ],
                    [ encounterAchievement.numberOfCompletions, victoryAchievement.numberOfCompletions ])
            })
        return new AchievementSet(this.id, this.displayName, fullAchievements);
    }
}