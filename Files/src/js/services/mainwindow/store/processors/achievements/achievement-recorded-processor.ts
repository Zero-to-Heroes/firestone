import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementRecordedEvent } from "../../events/achievements/achievement-recorded-event";
import { ReplayInfo } from "../../../../../models/replay-info";
import { CompletedAchievement } from "../../../../../models/completed-achievement";
import { AchievementsStorageService } from "../../../../achievement/achievements-storage.service";
import { AchievementSet } from "../../../../../models/achievement-set";
import { Events } from "../../../../events.service";
import { VisualAchievementCategory } from "../../../../../models/visual-achievement-category";
import { VisualAchievement, CompletionStep } from "../../../../../models/visual-achievement";
import { AchievementStateHelper } from "../../helper/achievement-state-helper";

export class AchievementRecordedProcessor implements Processor {

    constructor(
        private achievementStorage: AchievementsStorageService, 
        private achievementStateHelper: AchievementStateHelper,
        private events: Events) { }

    public async process(event: AchievementRecordedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const achievementId: string = event.achievementId;
        const replayInfo: ReplayInfo = event.replayInfo;
        const updatedAchievement = await this.saveReplayInfo(achievementId, replayInfo);
        const newGlobalCategories = this.updateGlobalCategories(currentState.achievements.globalCategories, achievementId, replayInfo);
        const newState = this.achievementStateHelper.updateStateFromNewGlobalCategories(currentState.achievements, newGlobalCategories);
        // TODO: Raising events here feels weird, and it's probably a design flaw.
        this.events.broadcast(Events.ACHIEVEMENT_RECORDED, updatedAchievement);
        return Object.assign(new MainWindowState(), currentState, {
            achievements: newState,
        });
    }

    private updateGlobalCategories(
            globalCategories: ReadonlyArray<VisualAchievementCategory>,
            achievementId: string,
            replayInfo: ReplayInfo): ReadonlyArray<VisualAchievementCategory> {
        const globalCategory = globalCategories
                .find((cat) => cat.achievementSets.some((set) => 
                    set.achievements.some((achievement) => 
                        achievement.completionSteps.some((step) => step.id === achievementId))));
        const achievementSet = globalCategory.achievementSets
                .find((set) => set.achievements.some((achievement) => 
                    achievement.completionSteps.some((step) => step.id === achievementId)));
        const updatedSet = this.updateReplayInfo(achievementSet, achievementId, replayInfo);
        const updatedGlobalCategory = this.updateCategory(globalCategory, updatedSet);
        
        const newCategories = globalCategories.map((cat) => cat.id === updatedGlobalCategory.id ? updatedGlobalCategory : cat);
        return newCategories as ReadonlyArray<VisualAchievementCategory>;
    }

    private updateCategory(globalCategory: VisualAchievementCategory, newSet: AchievementSet): VisualAchievementCategory {
        const newAchievements = globalCategory.achievementSets
                .map((set) => set.id === newSet.id ? newSet : set);
        return Object.assign(globalCategory, {
            achievementSets: newAchievements as ReadonlyArray<AchievementSet>,
        } as VisualAchievementCategory);
    }

    private updateReplayInfo(achievementSet: AchievementSet, achievementId: string, replayInfo: ReplayInfo): AchievementSet {
        const existingAchievement = 
            achievementSet.achievements.find((achv) => achv.completionSteps.some((step) => step.id === achievementId));
        const updatedReplayInfo = [replayInfo, ...existingAchievement.replayInfo] as ReadonlyArray<ReplayInfo>;
        const updatedAchievement = Object.assign(existingAchievement, {
            replayInfo: updatedReplayInfo,
        } as VisualAchievement);

        const existingIndex = achievementSet.achievements.indexOf(existingAchievement);
        let updatedAchievements = achievementSet.achievements
                .map((item, index) => index === existingIndex ? updatedAchievement : item);
        return Object.assign(achievementSet, {
            achievements: updatedAchievements as ReadonlyArray<VisualAchievement>,
        } as AchievementSet);
    }

    private async saveReplayInfo(achievementId: string, replayInfo: ReplayInfo) {
		const achievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievementId);
		const newAchievement = new CompletedAchievement(
				achievement.id,
				achievement.numberOfCompletions,
				[replayInfo, ...achievement.replayInfo]);
        return await this.achievementStorage.saveAchievement(newAchievement);
    }
}