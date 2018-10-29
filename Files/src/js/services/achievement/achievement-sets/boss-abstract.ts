import { AchievementSet } from "../../../models/achievement-set";
import { SetProvider } from "./set-provider";
import { VisualAchievement } from "../../../models/visual-achievement";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";
import { AllCardsService } from "../../all-cards.service";
import { FilterOption } from "../../../models/filter-option";
import { literalMap } from "@angular/compiler/src/output/output_ast";

export abstract class AbstractBossSetProvider extends SetProvider {

    private cardsService: AllCardsService;
    private categoryId: string;

    constructor(id: string, categoryId, displayName: string, types: string[], cardsService: AllCardsService) {
        super(id, displayName, types);
        this.categoryId = categoryId;
        this.cardsService = cardsService;
    }

    public supportsAchievement(allAchievements: Achievement[], achievementId: string): boolean {
        const type = allAchievements
                .find((achievement) => achievement.id == achievementId)
                .type
        return this.types.indexOf(type) !== -1;
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
        return new AchievementSet(this.id, this.displayName, this.categoryId, fullAchievements, filterOptions);
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
                    const replayInfo = completedAchievement ? completedAchievement.replayInfo : [];
                    return new Achievement(ref.id, ref.name, ref.type, ref.cardId, ref.difficulty, numberOfCompletions, replayInfo);
                });
        const fullAchievements: VisualAchievement[] = mergedAchievements
            .filter(achievement => achievement.type == this.types[0])
            .map((achievement, index) => {
                const encountedId = this.types[0] + '_' + achievement.cardId;
                const victoryId = this.types[1] + '_' + achievement.cardId;
                const encounterAchievement = mergedAchievements.filter((ach) => ach.id == encountedId)[0];
                const victoryAchievement = mergedAchievements.filter((ach) => ach.id == victoryId)[0];
                const cardText = this.cardsService.getCard(achievement.cardId).text || '...';
                const text = cardText.replace('<i>', '').replace('</i>', '');
                const replayInfo = [ ...(encounterAchievement.replayInfo || []), ...(victoryAchievement.replayInfo || [])]
                        .sort((a, b) => a.creationTimestamp - b.creationTimestamp);
                return { 
                    achievement: new VisualAchievement(
                        achievement.id,
                        achievement.name, 
                        this.id, 
                        achievement.cardId,
                        text,
                        [ encountedId, victoryId ],
                        [ encounterAchievement.numberOfCompletions, victoryAchievement.numberOfCompletions ],
                        replayInfo),
                    index: index }
            })
            .sort((a, b) => {
                const aVisibility = this.sortPriority(a.achievement);
                const bVisibility = this.sortPriority(b.achievement);
                return bVisibility - aVisibility || a.index - b.index;
            })
            .map((obj) => obj.achievement);
        return fullAchievements;
    }

    private sortPriority(achievement: VisualAchievement): number {
        if (achievement.numberOfCompletions[1] > 0) {
            return 2;
        }
        if (achievement.numberOfCompletions[0] > 0) {
            return 1;
        }
        return 0;
    }
}