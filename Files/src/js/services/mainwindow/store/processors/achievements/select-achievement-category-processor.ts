import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementsState } from "../../../../../models/mainwindow/achievements-state";
import { SelectAchievementCategoryEvent } from "../../events/achievements/select-achievement-category-event";
import { VisualAchievementCategory } from "../../../../../models/visual-achievement-category";
import { AchievementSet } from "../../../../../models/achievement-set";
import { SelectAchievementSetEvent } from "../../events/achievements/select-achievement-set-event";
import { SelectAchievementSetProcessor } from "./select-achievement-set-processor";

export class SelectAchievementCategoryProcessor implements Processor {

    public async process(event: SelectAchievementCategoryEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const globalCategory: VisualAchievementCategory = currentState.achievements.globalCategories
                .find((cat) => cat.id === event.globalCategoryId);
        // If there is a single sub-category, we diretly display it
        if (globalCategory.achievementSets.length === 1) {
            const singleEvent = new SelectAchievementSetEvent(globalCategory.achievementSets[0].id);
            return new SelectAchievementSetProcessor().process(singleEvent, currentState);
        }
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