import { MainWindowStoreEvent } from "../main-window-store-event";
import { Challenge } from "../../../../achievement/achievements/challenge";

export class AchievementCompletedEvent implements MainWindowStoreEvent {
    readonly challenge: Challenge;

    constructor(challenge: Challenge) {
        this.challenge = challenge;
    }
}