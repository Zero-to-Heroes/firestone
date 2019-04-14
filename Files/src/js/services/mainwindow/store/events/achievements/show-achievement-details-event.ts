import { MainWindowStoreEvent } from "../main-window-store-event";

export class ShowAchievementDetailsEvent implements MainWindowStoreEvent {
    readonly achievementId: string;

    constructor(achievementId: string) {
        this.achievementId = achievementId;
    }
    
    public eventName(): string {
        return 'ShowAchievementDetailsEvent';
    }

    public static eventName(): string {
        return 'ShowAchievementDetailsEvent';
    }
}