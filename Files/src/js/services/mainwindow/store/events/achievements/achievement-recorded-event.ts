import { MainWindowStoreEvent } from "../main-window-store-event";
import { ReplayInfo } from "../../../../../models/replay-info";

export class AchievementRecordedEvent implements MainWindowStoreEvent {
    readonly achievementId: string;
    readonly replayInfo: ReplayInfo;

    constructor(achievementId: string, replayInfo: ReplayInfo) {
        this.achievementId = achievementId;
        this.replayInfo = replayInfo;
    }
    
    public eventName(): string {
        return 'AchievementRecordedEvent';
    }

    public static eventName(): string {
        return 'AchievementRecordedEvent';
    }
}