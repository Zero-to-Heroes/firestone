import { AchievementSet } from "../../../models/achievement-set";
import { SetProvider } from "./set-provider";
import { VisualAchievement } from "../../../models/visual-achievement";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";
import { AllCardsService } from "../../all-cards.service";
import { FilterOption } from "../../../models/filter-option";

export class MonsterHuntBossSetProvider extends SetProvider {

    private cardsService: AllCardsService;

    constructor(cardsService: AllCardsService) {
        super('monster_hunt_boss', 'Monster Hunt Boss', ['monster_hunt_boss_encounter', 'monster_hunt_boss_victory']);
        this.cardsService = cardsService;
    }

    // Used only for display
    public provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet {
        const fullAchievements = this.createAchievements(allAchievements, completedAchievemnts);
        const filterOptions: ReadonlyArray<FilterOption> = [
            { value: 'ALL_ACHIEVEMENTS', label: 'All achievements', filterFunction: (a) => true },
            { value: 'ONLY_COMPLETED', label: 'Only completed', filterFunction: (a: VisualAchievement) => {
                return a.numberOfCompletions.reduce((a, b) => a + b, 0) > 0;
            }},
            { value: 'ONLY_MISSING', label: 'Only missing', filterFunction: (a: VisualAchievement) => {
                return a.numberOfCompletions.reduce((a, b) => a + b, 0) === 0;
            }},
        ]
        return new AchievementSet(this.id, this.displayName, fullAchievements, filterOptions);
    }

    private createAchievements(
            allAchievements: Achievement[], 
            completedAchievemnts?: CompletedAchievement[]): ReadonlyArray<VisualAchievement> {
        const mergedAchievements: Achievement[] = !completedAchievemnts
            ? allAchievements
            : allAchievements
                .map((ref: Achievement) => {
                    let completedAchievement = completedAchievemnts.filter(compl => compl.id == ref.id).pop();
                    const numberOfCompletions = completedAchievement ? completedAchievement.numberOfCompletions : 0;
                    return new Achievement(ref.id, ref.name, ref.type, ref.cardId, ref.difficulty, numberOfCompletions);
                });
        // console.log('merging achievements', completedAchievemnts, allAchievements, mergedAchievements);
        const fullAchievements: VisualAchievement[] = mergedAchievements
            .filter(achievement => achievement.type == 'monster_hunt_boss_encounter')
            .map((achievement) => {
                const encountedId = 'monster_hunt_boss_encounter_' + achievement.cardId;
                const victoryId = 'monster_hunt_boss_victory_' + achievement.cardId;
                const encounterAchievement = mergedAchievements.filter((ach) => ach.id == encountedId)[0];
                const victoryAchievement = mergedAchievements.filter((ach) => ach.id == victoryId)[0];
                const cardText = this.cardsService.getCard(achievement.cardId).text || '...';
                const text = cardText.replace('<i>', '').replace('</i>', '');
                return new VisualAchievement(
                    achievement.id,
                    achievement.name, 
                    this.id, 
                    achievement.cardId,
                    text,
                    [ encountedId, victoryId ],
                    [ encounterAchievement.numberOfCompletions, victoryAchievement.numberOfCompletions ])
            });
        return fullAchievements;
    }
}