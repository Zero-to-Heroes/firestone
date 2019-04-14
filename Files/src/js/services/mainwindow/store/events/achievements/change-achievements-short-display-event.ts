import { MainWindowStoreEvent } from "../main-window-store-event";

export class ChangeAchievementsShortDisplayEvent implements MainWindowStoreEvent {
    readonly shortDisplay: boolean;

    constructor(shortDisplay: boolean) {
        this.shortDisplay = shortDisplay;
    }
    
    public eventName(): string {
        return 'ChangeAchievementsShortDisplayEvent';
    }

    public static eventName(): string {
        return 'ChangeAchievementsShortDisplayEvent';
    }
}