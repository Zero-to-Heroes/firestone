import { MainWindowStoreEvent } from "../main-window-store-event";

export class ChangeVisibleAchievementEvent implements MainWindowStoreEvent {
    readonly achievementId: string;

    constructor(achievementId: string) {
        this.achievementId = achievementId;
    }
    
    public eventName(): string {
        return 'ChangeVisibleAchievementEvent';
    }

    public static eventName(): string {
        return 'ChangeVisibleAchievementEvent';
    }
}