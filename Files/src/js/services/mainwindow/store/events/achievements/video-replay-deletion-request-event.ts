import { MainWindowStoreEvent } from "../main-window-store-event";

export class VideoReplayDeletionRequestEvent implements MainWindowStoreEvent {
    readonly stepId: string;
    readonly videoPath: string;

    constructor(stepId: string, videoPath: string) {
        this.stepId = stepId;
        this.videoPath = videoPath;
    }
}