import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectAchievementSetEvent implements MainWindowStoreEvent {
    readonly achievementSetId: string;

    constructor(achievementSetId: string) {
        this.achievementSetId = achievementSetId;
    }
    
    public eventName(): string {
        return 'SelectAchievementSetEvent';
    }

    public static eventName(): string {
        return 'SelectAchievementSetEvent';
    }
}