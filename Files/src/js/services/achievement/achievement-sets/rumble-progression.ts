import { AchievementSet } from "../../../models/achievement-set";
import { SetProvider, IndexedVisualAchievement } from "./set-provider";
import { VisualAchievement, CompletionStep } from "../../../models/visual-achievement";
import { Achievement } from "../../../models/achievement";
import { CompletedAchievement } from "../../../models/completed-achievement";
import { AllCardsService } from "../../all-cards.service";
import { FilterOption } from "../../../models/filter-option";
import { AchievementConfService } from "../achievement-conf.service";

export class RumbleRunProgressionSetProvider extends SetProvider {

    private cardsService: AllCardsService;
    private categoryId: string;
    private conf: AchievementConfService;

    constructor(cardsService: AllCardsService, conf: AchievementConfService) {
        super('rumble_run_progression', 'Rumble Progression', ['rumble_run_progression']);
        this.categoryId = 'rumble_run_progression';
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
                    return a.completionSteps.every((step) => step.numberOfCompletions > 0);
                }, 
                emptyStateIcon: 'empty_state_Only_cards_I_have_illustration', 
                emptyStateTitle: 'Tons of achievements await you!', 
                emptyStateText: 'Find them listed here once completed.'
            },
        ];
    }

    protected convertToVisual(achievement: Achievement, index: number, allAchievements: Achievement[]): IndexedVisualAchievement {
        const replayInfo = [ ...(achievement.replayInfo || [])]
                .sort((a, b) => a.creationTimestamp - b.creationTimestamp);
        
        const rootId = achievement.id.substring(0, achievement.id.length - 2);
        // console.log('rootId', rootId);
        const achievementForCompletionSteps: Achievement[] = allAchievements
                .filter((achv) => achv.type === this.types[0])
                .filter((achv) => achv.id.startsWith(rootId))
                .sort((a, b) => parseInt(a.id.split(rootId)[1]) - parseInt(b.id.split(rootId)[1]));
        // console.log('achievements for completion steps', achievementForCompletionSteps);
        const playerClass = /.*\((.*)\).*/.exec(achievement.name)[1];
        // console.log('playerClass', /.*\((.*)\).*/.exec(achievement.name));
        let text = `Clear the first round with ${playerClass} to get started`;
        let alreadyDefinedText: boolean = false;
        // Useful to make sure we have some consistency in the number of comletions
        let maxNumberOfCompletions: number = 0;
        const invertedCompletionSteps = [];
        for (let i = 0; i < achievementForCompletionSteps.length; i++) {
            const achv = achievementForCompletionSteps[i];
            const completions: number = Math.max(maxNumberOfCompletions, achv.numberOfCompletions);
            maxNumberOfCompletions = completions;
            if (completions > 0 && !alreadyDefinedText) {
                text = achv.name;
                alreadyDefinedText = true;
            }
            invertedCompletionSteps.push({ 
                id: `${achv.id}`, 
                numberOfCompletions: completions,
                iconSvgSymbol: this.conf.icon(`${achv.type}_${i}`),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${completions} times` : ``;
                    return `You cleared Rumble Run's round ${i + 1} ${times}`;
                },
            } as CompletionStep);
        }
        const name = `Rumble run progression - ${playerClass}`;
        return {
            achievement: new VisualAchievement(
                achievement.id,
                name, 
                this.id, 
                achievement.cardId,
                text,
                invertedCompletionSteps.reverse(),
                replayInfo),
            index: index 
        };
    }

    protected isAchievementVisualRoot(achievement: Achievement): boolean {
        const index = achievement.id.substring(achievement.id.length - 1);
        return achievement.type == this.types[0] && parseInt(index) === 0;
    }
}