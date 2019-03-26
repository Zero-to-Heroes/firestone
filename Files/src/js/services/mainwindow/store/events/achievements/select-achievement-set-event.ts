import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectAchievementSetEvent implements MainWindowStoreEvent {
    readonly achievementSetId: string;

    constructor(achievementSetId: string) {
        this.achievementSetId = achievementSetId;
    }
}