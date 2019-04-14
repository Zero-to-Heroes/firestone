import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementsState } from "../../../../../models/mainwindow/achievements-state";
import { ChangeVisibleAchievementEvent } from "../../events/achievements/change-visible-achievement-event";
import { VisualAchievement } from "../../../../../models/visual-achievement";
import { AchievementSet } from "../../../../../models/achievement-set";

export class ChangeVisibleAchievementProcessor implements Processor {

    public async process(event: ChangeVisibleAchievementEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const globalCategory = currentState.achievements.globalCategories
                .find((cat) => cat.achievementSets.some((set) => 
                        set.achievements.some((achv) => achv.completionSteps.some((setp) => setp.id === event.achievementId))));
        const achievementSet = globalCategory.achievementSets
                .find((set) => set.achievements.some((achv) => achv.completionSteps.some((setp) => setp.id === event.achievementId)));
		const newSelectedAchievement: VisualAchievement = achievementSet.achievements
                .find((ach) => ach.completionSteps.some((step) => step.id === event.achievementId));
        const newState = Object.assign(new AchievementsState(), currentState.achievements, {
            currentView: 'list',
            menuDisplayType: 'breadcrumbs',
            selectedGlobalCategory: globalCategory,
            selectedCategory: achievementSet,
            achievementCategories: globalCategory.achievementSets as ReadonlyArray<AchievementSet>,
            achievementsList: achievementSet.achievements as ReadonlyArray<VisualAchievement>,
            selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
            shortDisplay: true,
        } as AchievementsState);
        return Object.assign(new MainWindowState(), currentState, {
            achievements: newState,
            isVisible: true,
        } as MainWindowState);
    }
}