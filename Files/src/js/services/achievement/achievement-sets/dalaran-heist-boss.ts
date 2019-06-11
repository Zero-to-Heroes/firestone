import { AllCardsService } from "../../all-cards.service";
import { AbstractBossSetProvider } from "./boss-abstract";
import { AchievementConfService } from "../achievement-conf.service";
import { Achievement } from "../../../models/achievement";
import { IndexedVisualAchievement } from "./set-provider";
import { CompletionStep, VisualAchievement } from "../../../models/visual-achievement";

export class DalaranHeistBossSetProvider extends AbstractBossSetProvider {

    constructor(cardsService: AllCardsService, conf: AchievementConfService) {
        super(
            'dalaran_heist_boss', 
            'achievements_boss',
            'Bosses', 
            [
                'dalaran_heist_boss_encounter', 
                'dalaran_heist_boss_victory', 
                'dalaran_heist_boss_encounter_heroic', 
                'dalaran_heist_boss_victory_heroic',
            ],
            cardsService,
            conf);
    }

    protected convertToVisual(achievement: Achievement, index: number, mergedAchievements: Achievement[]): IndexedVisualAchievement {
        // TODO: refactor
        const encountedId = this.types[0] + '_' + achievement.cardId;
        const victoryId = this.types[1] + '_' + achievement.cardId;
        const encounterHeroicId = this.types[2] + '_' + achievement.cardId;
        const victoryHeroicId = this.types[3] + '_' + achievement.cardId;
        const encounterAchievement = mergedAchievements.filter((ach) => ach.id == encountedId)[0];
        const victoryAchievement = mergedAchievements.filter((ach) => ach.id == victoryId)[0];
        const encounterHeroicAchievement = mergedAchievements.filter((ach) => ach.id == encounterHeroicId)[0];
        const victoryHeroicAchievement = mergedAchievements.filter((ach) => ach.id == victoryHeroicId)[0];
        const completionSteps = [
            { 
                id: encountedId, 
                numberOfCompletions: encounterAchievement.numberOfCompletions,
                iconSvgSymbol: this.conf.icon(encounterAchievement.type),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${encounterAchievement.numberOfCompletions} times` : ``;
                    return `You met ${achievement.name} ${times}`;
                },
            } as CompletionStep,
            { 
                id: victoryId, 
                numberOfCompletions: victoryAchievement.numberOfCompletions,
                iconSvgSymbol: this.conf.icon(victoryAchievement.type),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${victoryAchievement.numberOfCompletions} times` : ``;
                    return `You defeated ${achievement.name} ${times}`;
                },
            } as CompletionStep,
            { 
                id: encounterHeroicId, 
                numberOfCompletions: encounterHeroicAchievement.numberOfCompletions,
                iconSvgSymbol: this.conf.icon(encounterHeroicAchievement.type),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${encounterHeroicAchievement.numberOfCompletions} times` : ``;
                    return `You met ${achievement.name} (Heroic) ${times}`;
                },
            } as CompletionStep,
            { 
                id: victoryHeroicId, 
                numberOfCompletions: victoryHeroicAchievement.numberOfCompletions,
                iconSvgSymbol: this.conf.icon(victoryHeroicAchievement.type),
                text(showTimes: boolean = false): string {
                    const times = showTimes ? `${victoryHeroicAchievement.numberOfCompletions} times` : ``;
                    return `You defeated ${achievement.name} (Heroic) ${times}`;
                },
            } as CompletionStep,
        ]
        const replayInfo = [ 
            ...(encounterAchievement.replayInfo || []), 
            ...(victoryAchievement.replayInfo || []),
            ...(encounterHeroicAchievement.replayInfo || []), 
            ...(victoryHeroicAchievement.replayInfo || []),
        ].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
        const cardText = this.cardsService.getCard(achievement.cardId).text || '...';
        const text = cardText.replace('<i>', '').replace('</i>', '').replace('[x]', '');
        return {
            achievement: new VisualAchievement(
                achievement.id,
                achievement.name, 
                this.id, 
                achievement.cardId,
                achievement.cardType,
                text,
                completionSteps,
                replayInfo),
            index: index 
        };
    }
}