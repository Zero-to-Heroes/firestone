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
        super('monster_hunt_boss', 'Monster Hunt', ['monster_hunt_boss_encounter', 'monster_hunt_boss_victory']);
        this.cardsService = cardsService;
    }

    // Used only for display
    public provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet {
        const fullAchievements = this.createAchievements(allAchievements, completedAchievemnts);
        const filterOptions: ReadonlyArray<FilterOption> = [
            { 
                value: 'ALL_ACHIEVEMENTS', 
                label: 'All achievements', 
                filterFunction: (a) => true, 
                emptyStateIcon: 'empty_state_Only_cards_I_have_illustration', 
                emptyStateTitle: 'Holy Moly, you are epic!', 
                emptyStateText: '100% of achievements in this category complete.' 
            },
            { 
                value: 'ONLY_MISSING', 
                label: 'Locked achievements', 
                filterFunction: (a: VisualAchievement) => {
                    return a.numberOfCompletions.reduce((a, b) => a + b, 0) === 0;
                }, 
                emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
            { 
                value: 'ENCOUNTERED_ONLY', 
                label: 'Encountered only', 
                filterFunction: (a: VisualAchievement) => {
                    return a.numberOfCompletions[0] > 0 && a.numberOfCompletions[1] === 0;
                }, 
                emptyStateIcon: 'empty_state_Only_cards_I_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
            { 
                value: 'ONLY_COMPLETED', 
                label: 'Completed achievements', 
                filterFunction: (a: VisualAchievement) => {
                    return a.numberOfCompletions[0] > 0 && a.numberOfCompletions[1] > 0;
                }, 
                emptyStateIcon: 'empty_state_Only_cards_I_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
        ]
        return new AchievementSet(this.id, this.displayName, 'monster_hunt_category', fullAchievements, filterOptions);
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
            })
            .sort((a, b) => {
                const aVisibility = a.numberOfCompletions[1] > 0 ? 2 : (a.numberOfCompletions[0] > 0 ? 1 : 0);
                const bVisibility = b.numberOfCompletions[1] > 0 ? 2 : (b.numberOfCompletions[0] > 0 ? 1 : 0);
                return bVisibility - aVisibility;
            });
        return fullAchievements;
    }
}