import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectAchievementCategoryEvent implements MainWindowStoreEvent {
    readonly globalCategoryId: string;

    constructor(globalCategoryId: string) {
        this.globalCategoryId = globalCategoryId;
    }
    
    public eventName(): string {
        return 'SelectAchievementCategoryEvent';
    }

    public static eventName(): string {
        return 'SelectAchievementCategoryEvent';
    }
}