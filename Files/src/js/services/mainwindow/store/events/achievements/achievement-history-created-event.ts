import { MainWindowStoreEvent } from "../main-window-store-event";
import { AchievementHistory } from "../../../../../models/achievement/achievement-history";

export class AchievementHistoryCreatedEvent implements MainWindowStoreEvent {
    readonly history: AchievementHistory;

    constructor(history: AchievementHistory) {
        this.history = history;
    }
}