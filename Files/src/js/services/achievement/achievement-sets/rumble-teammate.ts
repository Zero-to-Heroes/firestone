import { AchievementSet } from "../../../models/achievement-set";
import { SetProvider, IndexedVisualAchievement } from "./set-provider";
import { VisualAchievement, CompletionStep } from "../../../models/visual-achievement";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";
import { AllCardsService } from "../../all-cards.service";
import { FilterOption } from "../../../models/filter-option";
import { AchievementConfService } from "../achievement-conf.service";

export class RumbleRunTeammatesSetProvider extends SetProvider {

    private cardsService: AllCardsService;
    private categoryId: string;
    private conf: AchievementConfService;

    constructor(cardsService: AllCardsService, conf: AchievementConfService) {
        super('rumble_run_teammate', 'Teammates', ['rumble_run_teammate_play']);
        this.categoryId = 'rumble_run_teammate';
        this.cardsService = cardsService;
        this.conf = conf;
    }

    // Used only for display
    public provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet {
        const fullAchievements = this.visualAchievements(allAchievements, completedAchievemnts);
        const filterOptions: ReadonlyArray<FilterOption> = this.filterOptions(); 
        return new AchievementSet(this.id, this.displayName, this.categoryId, fullAchievements, filterOptions);
    }

    protected filterOptions(): ReadonlyArray<FilterOption> {
        return [
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
                    return a.completionSteps.map((step) => step.numberOfCompletions).reduce((a, b) => a + b, 0) === 0;
                },
                emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
            { 
                value: 'ONLY_COMPLETED', 
                label: 'Completed achievements', 
                filterFunction: (a: VisualAchievement) => {
                    return a.completionSteps[0].numberOfCompletions > 0;
                }, 
                emptyStateIcon: 'empty_state_Only_cards_I_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
        ];
    }

    protected convertToVisual(achievement: Achievement, index: number): IndexedVisualAchievement {
        const cardText = this.cardsService.getCard(achievement.cardId).text || '...';
        const text = cardText.replace('<i>', '').replace('</i>', '').replace('[x]', '').replace('\n', ' ');
        const replayInfo = [ ...(achievement.replayInfo || [])]
                .sort((a, b) => a.creationTimestamp - b.creationTimestamp);
        const completionSteps = [
            { 
                id: achievement.id, 
                numberOfCompletions: achievement.numberOfCompletions,
                iconSvgSymbol: this.conf.icon(achievement.type),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${achievement.numberOfCompletions} times` : ``;
                    return `You played ${achievement.name} ${times}`;
                },
            } as CompletionStep,
        ]
        return {
            achievement: new VisualAchievement(
                achievement.id,
                achievement.name, 
                this.id, 
                achievement.cardId,
                text,
                completionSteps,
                replayInfo),
            index: index 
        };
    }

    protected isAchievementVisualRoot(achievement: Achievement): boolean {
        return achievement.type == this.types[0];
    }
}