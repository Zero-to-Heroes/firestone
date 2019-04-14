import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementsState } from "../../../../../models/mainwindow/achievements-state";
import { SelectAchievementCategoryEvent } from "../../events/achievements/select-achievement-category-event";
import { VisualAchievementCategory } from "../../../../../models/visual-achievement-category";
import { AchievementSet } from "../../../../../models/achievement-set";

export class SelectAchievementCategoryProcessor implements Processor {

    public async process(event: SelectAchievementCategoryEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const globalCategory: VisualAchievementCategory = currentState.achievements.globalCategories
                .find((cat) => cat.id === event.globalCategoryId);
        const newState = Object.assign(new AchievementsState(), currentState.achievements, {
            currentView: 'category',
            menuDisplayType: 'breadcrumbs',
            selectedGlobalCategory: globalCategory,
            achievementCategories: globalCategory.achievementSets as ReadonlyArray<AchievementSet>,
            selectedCategory: undefined,
            selectedAchievementId: undefined,
        } as AchievementsState);
        return Object.assign(new MainWindowState(), currentState, {
            achievements: newState,
            isVisible: true,
        } as MainWindowState);
    }
}